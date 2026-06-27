#fast-api/app.py

from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import cv2
import subprocess
import threading
import os
import json
import time
from datetime import datetime
import csv
import pandas as pd
from ultralytics import YOLO
import numpy as np
from queue import Queue
import base64
from collections import deque
import logging
import os.path
from datetime import datetime, timedelta

# Suppress YOLO warnings
logging.getLogger('ultralytics').setLevel(logging.WARNING)

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "yolov8n.pt")
LOG_DIR = os.path.join(BASE_DIR, "logs")
REPORTS_DIR = os.path.join(LOG_DIR, "reports")
CAMERAS_FILE = os.path.join(BASE_DIR, "cameras.json")
os.makedirs(LOG_DIR, exist_ok=True)

# Store camera configurations and frames
cameras = []
camera_processes = {}
camera_frames = {}  # Store latest frames for each camera
camera_stats = {}   # Store detection stats for each camera
camera_active = {}  # Track active camera threads
camera_errors = {}  # Track camera errors
frame_queues = {}   # Frame queues for each camera
camera_heatmap_data = {}  # Store person positions for heatmap generation

def resolve_local_path(path):
    """Resolve a user-provided local path from cwd or the fast-api directory."""
    if not path or not isinstance(path, str):
        return None

    candidates = [path]
    if not os.path.isabs(path):
        candidates.extend([
            os.path.abspath(path),
            os.path.join(BASE_DIR, path),
        ])

    for candidate in candidates:
        if os.path.exists(candidate):
            return os.path.abspath(candidate)
    return None

def load_cameras():
    global cameras
    if os.path.exists(CAMERAS_FILE):
        try:
            with open(CAMERAS_FILE, 'r') as f:
                cameras = json.load(f)
            print(f"Loaded {len(cameras)} cameras from file")
        except Exception as e:
            print(f"Error loading cameras: {e}")
            cameras = []

def save_cameras():
    with open(CAMERAS_FILE, 'w') as f:
        json.dump(cameras, f)

def read_crowd_log_dataframe(csv_file):
    """Read old and new crowd log row shapes into one normalized dataframe."""
    columns = ['Timestamp', 'Camera ID', 'Count', 'Density', 'Zone A', 'Zone B']
    rows = []
    if not os.path.exists(csv_file):
        return pd.DataFrame(rows, columns=columns)

    with open(csv_file, 'r', newline='') as f:
        reader = csv.reader(f)
        header = next(reader, None)

        for row in reader:
            if not row or row[0] == 'Timestamp':
                continue

            if len(row) >= 6:
                timestamp, camera_id, count, density, zone_a, zone_b = row[:6]
            elif len(row) >= 5:
                timestamp, count, density, zone_a, zone_b = row[:5]
                camera_id = ''
            else:
                continue

            rows.append({
                'Timestamp': timestamp,
                'Camera ID': camera_id,
                'Count': count,
                'Density': density,
                'Zone A': zone_a,
                'Zone B': zone_b
            })

    return pd.DataFrame(rows, columns=columns)

def start_camera_processing(camera, video_source=None):
    """Start or restart the worker thread that produces frames/stats for a camera."""
    camera_id = int(camera['id'])
    existing = camera_processes.get(camera_id)
    if existing and existing.is_alive():
        return

    source = video_source if video_source is not None else camera.get('video_source')
    if source is None:
        camera_errors[camera_id] = "Camera has no video source"
        return

    camera_active[camera_id] = True
    thread = threading.Thread(target=process_camera_stream, args=(camera_id, source))
    thread.daemon = True
    thread.start()
    camera_processes[camera_id] = thread

def process_camera_stream(camera_id, video_source):
    """Optimized camera stream processing with YOLO detection"""
    try:
        print(f"Starting camera stream processing for camera {camera_id}")
        print(f"Video source: {video_source}")
        
        # Load YOLO model
        model = YOLO(MODEL_PATH)
        
        # Optimize YOLO for speed
        model.conf = 0.5  # Confidence threshold
        
        # Handle different source types
        source = video_source
        
        # Check if it's a video file
        is_video_file = False
        actual_video_path = None
        
        if isinstance(source, str):
            # Check if it's a file path
            resolved_path = resolve_local_path(source)
            if resolved_path:
                actual_video_path = resolved_path
                is_video_file = True
                print(f"Detected video file: {actual_video_path}")
            # Check if it's a number for webcam
            elif source.isdigit():
                source = int(source)
                print(f"Using webcam index: {source}")
            # Check if it's a URL
            elif source.startswith(('http://', 'https://', 'rtsp://')):
                print(f"Using IP camera stream: {source}")
        
        # Open video capture
        if is_video_file:
            cap = cv2.VideoCapture(actual_video_path)
            print(f"Opening video file: {actual_video_path}")
        else:
            cap = cv2.VideoCapture(source)
        
        # Optimize capture settings for IP cameras
        if isinstance(source, str) and not is_video_file and (source.startswith('http') or source.startswith('rtsp')):
            print(f"Setting up IP camera stream: {source}")
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        if not cap.isOpened():
            print(f"Failed to open camera {camera_id}")
            camera_active[camera_id] = False
            camera_errors[camera_id] = "Failed to open camera stream"
            return
        
        print(f"Camera {camera_id} opened successfully")
        
        # Get video properties for video files
        if is_video_file:
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            print(f"Video file loaded: {total_frames} frames at {fps:.2f} FPS")
        
        # Configuration
        CONFIDENCE_THRESHOLD = 0.5
        DENSITY_THRESHOLDS = {"Low": 10, "Medium": 25, "High": 26}
        
        # Frame processing variables
        frame_count = 0
        process_every_n_frames = 2
        last_process_time = time.time()
        min_process_interval = 0.05
        
        # For FPS calculation
        fps_counter = 0
        fps_timer = time.time()
        
        # For smooth frame delivery
        last_sent_frame = None
        last_send_time = time.time()
        
        # For alert tracking
        last_alert_time = 0
        ALERT_COOLDOWN = 5
        
        # Initialize camera stats
        camera_stats[camera_id] = {
            'count': 0,
            'density': 'Low',
            'zone_a': 0,
            'zone_b': 0,
            'timestamp': datetime.now().isoformat(),
            'fps': 0
        }
        
        camera_active[camera_id] = True
        
        # Send initial frame
        ret, first_frame = cap.read()
        if ret:
            _, buffer = cv2.imencode('.jpg', first_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            camera_frames[camera_id] = buffer.tobytes()
            print(f"Initial frame captured for camera {camera_id}")
        
        while camera_active.get(camera_id, True):
            ret, frame = cap.read()
            if not ret:
                # If it's a video file, loop back to beginning
                if is_video_file:
                    print(f"End of video file reached for camera {camera_id}. Looping...")
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    print(f"Failed to read frame from camera {camera_id}, reconnecting...")
                    cap.release()
                    time.sleep(1)
                    cap = cv2.VideoCapture(source)
                    if isinstance(source, str) and not is_video_file and (source.startswith('http') or source.startswith('rtsp')):
                        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                    if not cap.isOpened():
                        print(f"Failed to reconnect camera {camera_id}")
                        time.sleep(5)
                        continue
                    continue
            
            frame_count += 1
            
            # Calculate FPS
            fps_counter += 1
            if time.time() - fps_timer >= 1.0:
                if camera_id in camera_stats:
                    camera_stats[camera_id]['fps'] = fps_counter
                fps_timer = time.time()
                fps_counter = 0
            
            # Process every nth frame for detection
            if frame_count % process_every_n_frames == 0:
                current_time = time.time()
                
                if current_time - last_process_time >= min_process_interval:
                    last_process_time = current_time
                    
                    # Resize frame for faster processing
                    h, w = frame.shape[:2]
                    target_width = 640
                    aspect_ratio = h / w
                    target_height = int(target_width * aspect_ratio)
                    
                    if w > target_width:
                        process_frame = cv2.resize(frame, (target_width, target_height))
                    else:
                        process_frame = frame.copy()
                    
                    # Run YOLO inference
                    results = model(process_frame, verbose=False, device='cpu')
                    
                    person_count = 0
                    current_centers = []
                    bounding_boxes = []
                    h_proc, w_proc = process_frame.shape[:2]
                    
                    # Process detections
                    for result in results:
                        boxes = result.boxes
                        if boxes is not None:
                            for box in boxes:
                                cls_id = int(box.cls[0])
                                conf = float(box.conf[0])
                                
                                if cls_id == 0 and conf >= CONFIDENCE_THRESHOLD:
                                    person_count += 1
                                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                                    
                                    if w > target_width:
                                        scale_x = w / w_proc
                                        scale_y = h / h_proc
                                        x1 = int(x1 * scale_x)
                                        x2 = int(x2 * scale_x)
                                        y1 = int(y1 * scale_y)
                                        y2 = int(y2 * scale_y)
                                    
                                    cx = (x1 + x2) // 2
                                    cy = (y1 + y2) // 2
                                    current_centers.append((cx, cy))
                                    bounding_boxes.append(((x1, y1, x2, y2), conf))
                    
                    # Determine density level
                    if person_count <= DENSITY_THRESHOLDS["Low"]:
                        density_text = "Low"
                        density_color = (0, 255, 0)
                    elif person_count <= DENSITY_THRESHOLDS["Medium"]:
                        density_text = "Medium"
                        density_color = (0, 255, 255)
                    else:
                        density_text = "High"
                        density_color = (0, 0, 255)
                    
                    # Zone tracking
                    za = sum(1 for cx, cy in current_centers if cx < w // 2)
                    zb = sum(1 for cx, cy in current_centers if cx >= w // 2)
                    
                    # Create annotated frame
                    display_frame = frame.copy()
                    
                    # Draw bounding boxes
                    for (x1, y1, x2, y2), conf in bounding_boxes:
                        cv2.rectangle(display_frame, (x1, y1), (x2, y2), density_color, 2)
                        cv2.putText(display_frame, f"P {conf:.2f}", (x1, max(y1-5, 0)), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, density_color, 1)
                    
                    # Draw zones
                    cv2.line(display_frame, (w//2, 0), (w//2, h), (255, 255, 255), 1)
                    
                    # Add overlay text
                    cv2.rectangle(display_frame, (0, 0), (250, 90), (0, 0, 0), -1)
                    cv2.putText(display_frame, f"Count: {person_count}", (5, 20), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                    cv2.putText(display_frame, f"Density: {density_text}", (5, 40), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, density_color, 1)
                    cv2.putText(display_frame, f"Zones: {za}|{zb}", (5, 60), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                    
                    # Add video file info
                    if is_video_file:
                        current_frame = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
                        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                        if total_frames > 0:
                            progress_text = f"Frame: {current_frame}/{total_frames}"
                            cv2.putText(display_frame, progress_text, (w - 180, 25), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                        
                        # Add video file name
                        video_name = os.path.basename(actual_video_path) if actual_video_path else "Video File"
                        cv2.putText(display_frame, video_name, (w - 180, 50), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
                    
                    # Store the processed frame
                    last_sent_frame = display_frame
                    
                    # Update stats
                    camera_stats[camera_id] = {
                        'count': person_count,
                        'density': density_text,
                        'zone_a': za,
                        'zone_b': zb,
                        'timestamp': datetime.now().isoformat(),
                        'fps': fps_counter
                    }
                    
                    # Store person positions for heatmap
                    camera_heatmap_data[camera_id] = {
                        'positions': [{'cx': cx, 'cy': cy} for cx, cy in current_centers],
                        'bounding_boxes': [{'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2, 'conf': conf} for (x1, y1, x2, y2), conf in bounding_boxes],
                        'frame_width': w,
                        'frame_height': h,
                        'count': person_count,
                        'density': density_text,
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    # Generate alert if density is High
                    if density_text == "High" and (current_time - last_alert_time) > ALERT_COOLDOWN:
                        last_alert_time = current_time
                        # Create alert in logs
                        alert_data = {
                            'id': int(time.time()),
                            'type': 'overcrowding',
                            'level': 'danger',
                            'title': 'Critical Overcrowding Detected',
                            'description': f'Density level: HIGH with {person_count} people detected',
                            'zone': 'Zone A' if za > zb else 'Zone B',
                            'time': datetime.now().isoformat(),
                            'resolved': False,
                            'camera_id': camera_id
                        }
                        
                        # Save alert to CSV
                        alert_file = os.path.join(LOG_DIR, "alerts.csv")
                        os.makedirs(LOG_DIR, exist_ok=True)
                        file_exists = os.path.exists(alert_file)
                        
                        with open(alert_file, 'a', newline='') as f:
                            writer = csv.writer(f)
                            if not file_exists:
                                writer.writerow(["ID", "Type", "Level", "Title", "Description", "Zone", "Time", "Camera ID", "Resolved"])
                            writer.writerow([alert_data['id'], alert_data['type'], alert_data['level'], 
                                           alert_data['title'], alert_data['description'], alert_data['zone'], 
                                           alert_data['time'], alert_data['camera_id'], alert_data['resolved']])
                        
                        print(f"[ALERT] Camera {camera_id}: High density detected! {person_count} people")
                    
                    # Log to CSV every 5 seconds - FIXED: Ensure numeric values are written as numbers
                    if int(time.time()) % 5 == 0 and time.time() - last_send_time > 5:
                        csv_file = os.path.join(LOG_DIR, "crowd_log.csv")
                        os.makedirs(LOG_DIR, exist_ok=True)
                        file_exists = os.path.exists(csv_file)
                        
                        with open(csv_file, 'a', newline='') as f:
                            writer = csv.writer(f)
                            if not file_exists:
                                writer.writerow(["Timestamp", "Camera ID", "Count", "Density", "Zone A", "Zone B"])
                            # Write values with proper types - Count, Zone A, Zone B as integers
                            writer.writerow([
                                datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                str(camera_id),  # Camera ID as string
                                int(person_count),  # Integer
                                str(density_text),  # String
                                int(za),  # Integer
                                int(zb)   # Integer
                            ])
                        last_send_time = time.time()
            
            # Always store the latest frame
            if last_sent_frame is not None:
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, 70]
                _, buffer = cv2.imencode('.jpg', last_sent_frame, encode_params)
                camera_frames[camera_id] = buffer.tobytes()
            else:
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                camera_frames[camera_id] = buffer.tobytes()
            
            # Small delay to prevent CPU overload
            time.sleep(0.01)
            
    except Exception as e:
        print(f"Error in camera stream {camera_id}: {e}")
        import traceback
        traceback.print_exc()
        camera_errors[camera_id] = str(e)
    finally:
        if 'cap' in locals():
            cap.release()
        camera_active[camera_id] = False
        print(f"Camera {camera_id} stream ended")

@app.route('/api/cameras', methods=['GET'])
def get_cameras():
    response = []
    for camera in cameras:
        camera_id = camera['id']
        camera_view = camera.copy()
        if camera_id in camera_frames and camera_frames[camera_id] is not None:
            camera_view['status'] = 'online'
        elif camera_id in camera_errors:
            camera_view['status'] = 'error'
            camera_view['error'] = camera_errors[camera_id]
        elif camera_active.get(camera_id):
            camera_view['status'] = 'connecting'
        else:
            camera_view['status'] = camera.get('status', 'offline')

        stats = camera_stats.get(camera_id)
        if stats:
            camera_view['count'] = stats.get('count', camera_view.get('count', 0))
            camera_view['density'] = stats.get('density', camera_view.get('density', 'Low'))
            camera_view['fps'] = stats.get('fps', camera_view.get('fps', 0))
            camera_view['zone_a'] = stats.get('zone_a', 0)
            camera_view['zone_b'] = stats.get('zone_b', 0)
            camera_view['last_seen_at'] = stats.get('timestamp')

        response.append(camera_view)
    return jsonify(response)

@app.route('/api/cameras', methods=['POST'])
def add_camera():
    data = request.json
    print(f"Received camera data: {data}")
    
    camera_name = data.get('name')
    ip = data.get('ip')
    port = data.get('port')
    protocol = data.get('protocol', 'http')
    video_path = data.get('video_path')
    
    # Construct video source
    if video_path:
        # Resolve video path to absolute path
        video_source = resolve_local_path(video_path)
        if not video_source:
            return jsonify({'success': False, 'error': f'Video file not found: {video_path}'}), 400
        
        display_name = camera_name or f"Video: {os.path.basename(video_source)}"
    elif ip == '0' or ip == 0:
        video_source = 0
        display_name = camera_name or "Webcam"
    elif ip and port:
        if protocol == 'rtsp':
            video_source = f"rtsp://{ip}:{port}/live"
        else:
            video_source = f"http://{ip}:{port}/video"
        display_name = camera_name or f"Camera at {ip}:{port}"
    else:
        return jsonify({'success': False, 'error': 'Invalid camera configuration'}), 400
    
    # Generate new ID
    new_id = max([c.get('id', 0) for c in cameras], default=0) + 1
    
    camera = {
        'id': new_id,
        'name': display_name,
        'ip': ip,
        'port': port,
        'protocol': protocol,
        'video_source': str(video_source),
        'status': 'connecting',
        'count': 0,
        'density': 0,
        'level': 'success',
        'fps': 30,
        'added_at': datetime.now().isoformat()
    }
    
    cameras.append(camera)
    save_cameras()
    
    # Stop existing thread if any
    if camera['id'] in camera_processes:
        camera_active[camera['id']] = False
        time.sleep(0.5)
    
    # Start camera processing in a separate thread
    start_camera_processing(camera, video_source)
    
    return jsonify({'success': True, 'camera': camera}), 201

@app.route('/api/cameras/<int:camera_id>', methods=['DELETE'])
def delete_camera(camera_id):
    global cameras
    if camera_id in camera_active:
        camera_active[camera_id] = False
    cameras = [c for c in cameras if c['id'] != camera_id]
    save_cameras()
    
    if camera_id in camera_frames:
        del camera_frames[camera_id]
    if camera_id in camera_stats:
        del camera_stats[camera_id]
    if camera_id in camera_active:
        del camera_active[camera_id]
    
    return jsonify({'success': True})

@app.route('/api/cameras/<int:camera_id>/frame')
def get_camera_frame(camera_id):
    """Stream the camera frame with optimized delivery"""
    frame = camera_frames.get(camera_id)
    if frame:
        return Response(frame, mimetype='image/jpeg', headers={
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*'
        })
    else:
        placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(placeholder, f"Connecting to camera {camera_id}...", (50, 240), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        _, buffer = cv2.imencode('.jpg', placeholder)
        return Response(buffer.tobytes(), mimetype='image/jpeg')

@app.route('/api/cameras/<int:camera_id>/stats')
def get_camera_stats(camera_id):
    stats = camera_stats.get(camera_id, {
        'count': 0,
        'density': 'Low',
        'zone_a': 0,
        'zone_b': 0,
        'fps': 0,
        'timestamp': datetime.now().isoformat()
    })
    return jsonify(stats)

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get all alerts from CSV"""
    alerts = []
    alert_file = os.path.join(LOG_DIR, "alerts.csv")
    
    if os.path.exists(alert_file):
        try:
            with open(alert_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Read from the actual CSV columns: ID, Type, Level, Title, Description, Zone, Time, Camera ID, Resolved
                    resolved_val = row.get('Resolved', 'False')
                    is_resolved = resolved_val in ('True', 'true', '1')
                    
                    alert = {
                        'id': int(row.get('ID', len(alerts))),
                        'type': row.get('Type', 'overcrowding'),
                        'level': row.get('Level', 'warning'),
                        'title': row.get('Title', 'Alert'),
                        'description': row.get('Description', ''),
                        'zone': row.get('Zone', 'Zone A'),
                        'time': row.get('Time', datetime.now().isoformat()),
                        'camera_id': row.get('Camera ID', None),
                        'resolved': is_resolved
                    }
                    alerts.append(alert)
            
            # Sort by time descending and limit to 50
            alerts.sort(key=lambda x: x['time'], reverse=True)
            return jsonify(alerts[:50])
        except Exception as e:
            print(f"Error reading alerts file: {e}")
    
    # Return empty array if no alerts
    return jsonify([])

@app.route('/api/alerts', methods=['POST'])
def create_alert():
    """Create a new alert"""
    data = request.json
    alert_file = os.path.join(LOG_DIR, "alerts.csv")
    os.makedirs(LOG_DIR, exist_ok=True)
    
    alert_data = {
        'id': int(time.time()),
        'type': data.get('type', 'overcrowding'),
        'level': data.get('level', 'warning'),
        'title': data.get('title', 'Alert'),
        'description': data.get('description', ''),
        'zone': data.get('zone', 'Unknown'),
        'time': datetime.now().isoformat(),
        'resolved': False
    }
    
    file_exists = os.path.exists(alert_file)
    with open(alert_file, 'a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["ID", "Type", "Level", "Title", "Description", "Zone", "Time", "Resolved"])
        writer.writerow([
            alert_data['id'], alert_data['type'], alert_data['level'],
            alert_data['title'], alert_data['description'], alert_data['zone'],
            alert_data['time'], alert_data['resolved']
        ])
    
    return jsonify(alert_data), 201

@app.route('/api/alerts/<int:alert_id>/resolve', methods=['PUT'])
def resolve_alert(alert_id):
    """Resolve an alert"""
    alert_file = os.path.join(LOG_DIR, "alerts.csv")
    temp_file = os.path.join(LOG_DIR, "alerts_temp.csv")
    
    if not os.path.exists(alert_file):
        return jsonify({'error': 'Alert not found'}), 404
    
    updated = False
    with open(alert_file, 'r') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        with open(temp_file, 'w', newline='') as temp_f:
            writer = csv.DictWriter(temp_f, fieldnames=fieldnames)
            writer.writeheader()
            
            for row in reader:
                if int(row['ID']) == alert_id:
                    row['Resolved'] = 'True'
                    updated = True
                writer.writerow(row)
    
    if updated:
        os.replace(temp_file, alert_file)
        return jsonify({'success': True})
    
    os.remove(temp_file)
    return jsonify({'error': 'Alert not found'}), 404

@app.route('/api/alerts/stats', methods=['GET'])
def get_alert_stats():
    """Get alert statistics"""
    alert_file = os.path.join(LOG_DIR, "alerts.csv")
    stats = {
        'total': 0,
        'active': 0,
        'critical': 0,
        'warning': 0,
        'by_type': {
            'overcrowding': 0,
            'intrusion': 0,
            'panic': 0,
            'surge': 0
        }
    }
    
    if os.path.exists(alert_file):
        try:
            with open(alert_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    stats['total'] += 1
                    if row['Resolved'] == 'False':
                        stats['active'] += 1
                        if row['Level'] == 'danger':
                            stats['critical'] += 1
                        elif row['Level'] == 'warning':
                            stats['warning'] += 1
                    
                    alert_type = row['Type']
                    if alert_type in stats['by_type']:
                        stats['by_type'][alert_type] += 1
        except Exception as e:
            print(f"Error reading stats: {e}")
    
    return jsonify(stats)

@app.route('/api/heatmap/data', methods=['GET'])
def get_heatmap_data():
    """Get real-time person positions and density grid for all cameras"""
    GRID_ROWS = 20
    GRID_COLS = 20
    
    result = {
        'cameras': {},
        'grid': [[0.0] * GRID_COLS for _ in range(GRID_ROWS)],
        'total_people': 0,
        'timestamp': datetime.now().isoformat()
    }
    
    for cam in cameras:
        cam_id = cam['id']
        heatmap = camera_heatmap_data.get(cam_id)
        stats = camera_stats.get(cam_id, {})
        
        if heatmap:
            # Normalize positions to 0-1 range
            fw = heatmap.get('frame_width', 640)
            fh = heatmap.get('frame_height', 480)
            
            normalized_positions = []
            for pos in heatmap.get('positions', []):
                nx = pos['cx'] / fw if fw > 0 else 0
                ny = pos['cy'] / fh if fh > 0 else 0
                normalized_positions.append({'x': round(nx, 4), 'y': round(ny, 4)})
            
            normalized_boxes = []
            for box in heatmap.get('bounding_boxes', []):
                normalized_boxes.append({
                    'x1': round(box['x1'] / fw, 4) if fw > 0 else 0,
                    'y1': round(box['y1'] / fh, 4) if fh > 0 else 0,
                    'x2': round(box['x2'] / fw, 4) if fw > 0 else 0,
                    'y2': round(box['y2'] / fh, 4) if fh > 0 else 0,
                    'conf': round(box['conf'], 3)
                })
            
            result['cameras'][str(cam_id)] = {
                'name': cam.get('name', f'Camera {cam_id}'),
                'positions': normalized_positions,
                'bounding_boxes': normalized_boxes,
                'count': heatmap.get('count', 0),
                'density': heatmap.get('density', 'Low'),
                'frame_width': fw,
                'frame_height': fh,
                'timestamp': heatmap.get('timestamp', '')
            }
            result['total_people'] += heatmap.get('count', 0)
            
            # Accumulate into the density grid using Gaussian spread
            for pos in normalized_positions:
                grid_col = min(GRID_COLS - 1, max(0, int(pos['x'] * GRID_COLS)))
                grid_row = min(GRID_ROWS - 1, max(0, int(pos['y'] * GRID_ROWS)))
                
                # Apply Gaussian-like spread to surrounding cells
                for dr in range(-2, 3):
                    for dc in range(-2, 3):
                        r = grid_row + dr
                        c = grid_col + dc
                        if 0 <= r < GRID_ROWS and 0 <= c < GRID_COLS:
                            dist = (dr * dr + dc * dc) ** 0.5
                            weight = max(0, 1.0 - dist / 3.0)
                            result['grid'][r][c] += weight
        else:
            result['cameras'][str(cam_id)] = {
                'name': cam.get('name', f'Camera {cam_id}'),
                'positions': [],
                'bounding_boxes': [],
                'count': stats.get('count', 0),
                'density': stats.get('density', 'Low'),
                'frame_width': 640,
                'frame_height': 480,
                'timestamp': stats.get('timestamp', '')
            }
    
    # Normalize grid values to 0-1 range
    max_val = max(max(row) for row in result['grid']) if result['total_people'] > 0 else 1
    if max_val > 0:
        result['grid'] = [[round(min(1.0, cell / max_val), 4) for cell in row] for row in result['grid']]
    
    return jsonify(result)

@app.route('/api/cameras/<int:camera_id>/heatmap')
def get_camera_heatmap(camera_id):
    """Generate a heatmap image overlay from detected person positions"""
    heatmap = camera_heatmap_data.get(camera_id)
    
    if not heatmap or not heatmap.get('positions'):
        # Return a blank dark heatmap
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(blank, 'No detections', (220, 245), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 100), 2)
        _, buffer = cv2.imencode('.jpg', blank)
        return Response(buffer.tobytes(), mimetype='image/jpeg')
    
    fw = heatmap.get('frame_width', 640)
    fh = heatmap.get('frame_height', 480)
    
    # Create density accumulation map at full resolution
    density_map = np.zeros((fh, fw), dtype=np.float32)
    
    for pos in heatmap.get('positions', []):
        cx, cy = pos['cx'], pos['cy']
        # Create a Gaussian blob around each person
        radius = max(30, min(fw, fh) // 8)
        y_coords, x_coords = np.ogrid[max(0, cy - radius):min(fh, cy + radius), max(0, cx - radius):min(fw, cx + radius)]
        dist_sq = (x_coords - cx) ** 2 + (y_coords - cy) ** 2
        gaussian = np.exp(-dist_sq / (2 * (radius / 2.5) ** 2))
        
        y_start = max(0, cy - radius)
        y_end = min(fh, cy + radius)
        x_start = max(0, cx - radius)
        x_end = min(fw, cx + radius)
        density_map[y_start:y_end, x_start:x_end] += gaussian
    
    # Normalize to 0-255
    if density_map.max() > 0:
        density_map = (density_map / density_map.max() * 255).astype(np.uint8)
    else:
        density_map = density_map.astype(np.uint8)
    
    # Apply Gaussian blur for smoothness
    density_map = cv2.GaussianBlur(density_map, (31, 31), 0)
    
    # Apply colormap (COLORMAP_JET: blue->green->yellow->red)
    heatmap_colored = cv2.applyColorMap(density_map, cv2.COLORMAP_JET)
    
    # Make low-density areas transparent (dark)
    # Create alpha mask from density
    alpha = density_map.astype(np.float32) / 255.0
    alpha = np.clip(alpha * 2.0, 0, 0.85)  # Boost alpha, cap at 85%
    alpha = np.stack([alpha] * 3, axis=-1)
    
    # Blend with actual camera frame or black background
    bg_frame = None
    if camera_id in camera_frames:
        try:
            nparr = np.frombuffer(camera_frames[camera_id], np.uint8)
            bg_frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if bg_frame is not None:
                bg_frame = cv2.resize(bg_frame, (fw, fh))
        except Exception as e:
            print(f"Error decoding background frame: {e}")
            
    if bg_frame is not None:
        # Blend with the real video frame
        result = (heatmap_colored * alpha + bg_frame * (1 - alpha)).astype(np.uint8)
    else:
        # Fallback to black background
        result = (heatmap_colored * alpha).astype(np.uint8)
    
    # Add detection count overlay
    count = heatmap.get('count', 0)
    density = heatmap.get('density', 'Low')
    
    # Draw dark background for text to make it readable on video
    cv2.rectangle(result, (5, 5), (200, 75), (0, 0, 0), -1)
    cv2.putText(result, f'People: {count}', (15, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(result, f'Density: {density}', (15, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    
    _, buffer = cv2.imencode('.jpg', result, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return Response(buffer.tobytes(), mimetype='image/jpeg', headers={
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
    })

@app.route('/api/heatmap/grid', methods=['GET'])
def get_heatmap_grid():
    """Get aggregated density grid across all cameras"""
    rows = int(request.args.get('rows', 20))
    cols = int(request.args.get('cols', 20))
    rows = min(50, max(5, rows))
    cols = min(50, max(5, cols))
    
    grid = [[0.0] * cols for _ in range(rows)]
    total = 0
    
    for cam_id, heatmap in camera_heatmap_data.items():
        if not heatmap or not heatmap.get('positions'):
            continue
        fw = heatmap.get('frame_width', 640)
        fh = heatmap.get('frame_height', 480)
        total += heatmap.get('count', 0)
        
        for pos in heatmap.get('positions', []):
            nx = pos['cx'] / fw if fw > 0 else 0
            ny = pos['cy'] / fh if fh > 0 else 0
            gc = min(cols - 1, max(0, int(nx * cols)))
            gr = min(rows - 1, max(0, int(ny * rows)))
            
            for dr in range(-2, 3):
                for dc in range(-2, 3):
                    r, c = gr + dr, gc + dc
                    if 0 <= r < rows and 0 <= c < cols:
                        dist = (dr * dr + dc * dc) ** 0.5
                        grid[r][c] += max(0, 1.0 - dist / 3.0)
    
    max_val = max(max(row) for row in grid) if total > 0 else 1
    if max_val > 0:
        grid = [[round(min(1.0, cell / max_val), 4) for cell in row] for row in grid]
    
    return jsonify({
        'grid': grid,
        'rows': rows,
        'cols': cols,
        'total_people': total,
        'active_cameras': len([c for c in camera_heatmap_data.values() if c and c.get('positions')]),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/debug/cameras', methods=['GET'])
def debug_cameras():
    debug_info = {
        'active_cameras': list(camera_active.keys()),
        'frames_available': list(camera_frames.keys()),
        'stats_available': list(camera_stats.keys()),
        'heatmap_available': list(camera_heatmap_data.keys()),
        'errors': camera_errors,
        'cameras': cameras
    }
    return jsonify(debug_info)

@app.route('/api/reports/daily', methods=['GET'])
def get_daily_report():
    """Get daily report data for analytics - FIXED VERSION"""
    try:
        date_param = request.args.get('date')
        days_param = request.args.get('days', '7')
        
        # Get date range
        if date_param:
            target_date = datetime.strptime(date_param, '%Y-%m-%d')
            start_date = target_date.replace(hour=0, minute=0, second=0)
            end_date = target_date.replace(hour=23, minute=59, second=59)
        else:
            days = int(days_param)
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
        
        # Read logs
        csv_file = os.path.join(LOG_DIR, "crowd_log.csv")
        alert_file = os.path.join(LOG_DIR, "alerts.csv")
        
        daily_data = []
        daily_alerts = []
        zone_stats = {'zone_rankings': []}
        
        # Parse crowd data
        if os.path.exists(csv_file):
            try:
                df = read_crowd_log_dataframe(csv_file)
                
                # Ensure proper data types
                df['Timestamp'] = pd.to_datetime(df['Timestamp'])
                df['Count'] = pd.to_numeric(df['Count'], errors='coerce')
                df['Zone A'] = pd.to_numeric(df['Zone A'], errors='coerce')
                df['Zone B'] = pd.to_numeric(df['Zone B'], errors='coerce')
                
                # Drop rows with NaN in Count
                df = df.dropna(subset=['Count'])
                
                if df.empty:
                    print("No valid data in CSV after cleaning")
                else:
                    # Filter by date range
                    mask = (df['Timestamp'] >= start_date) & (df['Timestamp'] <= end_date)
                    filtered_df = df[mask]
                    
                    if not filtered_df.empty:
                        # Group by date
                        filtered_df['Date'] = filtered_df['Timestamp'].dt.date
                        
                        for date, group in filtered_df.groupby('Date'):
                            # Calculate statistics with proper error handling
                            total_count = int(group['Count'].sum()) if not group['Count'].empty else 0
                            avg_count = float(round(group['Count'].mean(), 1)) if not group['Count'].empty else 0
                            peak_count = int(group['Count'].max()) if not group['Count'].empty else 0
                            
                            # Get peak time
                            peak_time = 'N/A'
                            if not group['Count'].empty and group['Count'].idxmax() is not None:
                                try:
                                    peak_row = group.loc[group['Count'].idxmax()]
                                    peak_time = peak_row['Timestamp'].strftime('%H:%M')
                                except:
                                    peak_time = 'N/A'
                            
                            # Get most common density
                            avg_density = 'Low'
                            if 'Density' in group.columns:
                                density_values = group['Density'].dropna()
                                if not density_values.empty:
                                    mode_result = density_values.mode()
                                    if not mode_result.empty:
                                        avg_density = mode_result.iloc[0]
                            
                            daily_entry = {
                                'date': date.strftime('%Y-%m-%d'),
                                'total_count': total_count,
                                'avg_count': avg_count,
                                'peak_count': peak_count,
                                'peak_time': peak_time,
                                'avg_density': avg_density,
                                'hourly_data': []
                            }
                            
                            # Get hourly breakdown
                            group['Hour'] = group['Timestamp'].dt.hour
                            for hour in range(24):
                                hour_data = group[group['Hour'] == hour]
                                if not hour_data.empty and not hour_data['Count'].empty:
                                    daily_entry['hourly_data'].append({
                                        'hour': hour,
                                        'count': int(round(hour_data['Count'].mean()))
                                    })
                            
                            daily_data.append(daily_entry)
                    else:
                        print(f"No data found for date range: {start_date} to {end_date}")
            except Exception as e:
                print(f"Error parsing crowd data: {e}")
                import traceback
                traceback.print_exc()
        
        # Parse alerts
        if os.path.exists(alert_file):
            try:
                df_alerts = pd.read_csv(alert_file)
                if 'Time' in df_alerts.columns:
                    df_alerts['Time'] = pd.to_datetime(df_alerts['Time'], errors='coerce')
                    df_alerts = df_alerts.dropna(subset=['Time'])
                    
                    mask = (df_alerts['Time'] >= start_date) & (df_alerts['Time'] <= end_date)
                    filtered_alerts = df_alerts[mask]
                    
                    for _, alert in filtered_alerts.iterrows():
                        alert_date = alert['Time'].date()
                        daily_alerts.append({
                            'date': alert_date.strftime('%Y-%m-%d'),
                            'type': str(alert.get('Type', 'unknown')),
                            'level': str(alert.get('Level', 'warning')),
                            'time': alert['Time'].isoformat(),
                            'zone': str(alert.get('Zone', 'Unknown'))
                        })
            except Exception as e:
                print(f"Error parsing alerts: {e}")
        
        # Calculate zone rankings from recent data
        if os.path.exists(csv_file):
            try:
                df = read_crowd_log_dataframe(csv_file)
                df['Timestamp'] = pd.to_datetime(df['Timestamp'])
                df['Zone A'] = pd.to_numeric(df['Zone A'], errors='coerce')
                df['Zone B'] = pd.to_numeric(df['Zone B'], errors='coerce')
                
                last_24h = df[df['Timestamp'] >= (datetime.now() - timedelta(hours=24))]
                
                if not last_24h.empty:
                    zone_a_avg = last_24h['Zone A'].mean()
                    zone_b_avg = last_24h['Zone B'].mean()
                    zone_a_peak = last_24h['Zone A'].max()
                    zone_b_peak = last_24h['Zone B'].max()
                    
                    # Handle NaN values
                    zone_a_avg = float(round(zone_a_avg, 1)) if not pd.isna(zone_a_avg) else 0
                    zone_b_avg = float(round(zone_b_avg, 1)) if not pd.isna(zone_b_avg) else 0
                    zone_a_peak = int(zone_a_peak) if not pd.isna(zone_a_peak) else 0
                    zone_b_peak = int(zone_b_peak) if not pd.isna(zone_b_peak) else 0
                    
                    zone_stats = {
                        'zone_rankings': [
                            {
                                'zone': 'Zone A',
                                'avg_density': zone_a_avg,
                                'peak_count': zone_a_peak,
                                'alerts': len([a for a in daily_alerts if a['zone'] == 'Zone A' and a['date'] >= (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')])
                            },
                            {
                                'zone': 'Zone B',
                                'avg_density': zone_b_avg,
                                'peak_count': zone_b_peak,
                                'alerts': len([a for a in daily_alerts if a['zone'] == 'Zone B' and a['date'] >= (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')])
                            }
                        ]
                    }
            except Exception as e:
                print(f"Error calculating zone rankings: {e}")
        
        # Calculate alert summary
        alert_summary = {}
        for alert in daily_alerts:
            alert_type = alert['type']
            if alert_type not in alert_summary:
                alert_summary[alert_type] = 0
            alert_summary[alert_type] += 1
        
        alert_summary_list = [
            {'name': k, 'value': v, 'color': get_alert_color(k)}
            for k, v in alert_summary.items()
        ]
        
        # Get peak data
        peak_data = []
        if daily_data:
            for day in daily_data:
                for hour in day.get('hourly_data', []):
                    peak_data.append({
                        'time': f"{hour['hour']}:00",
                        'count': hour['count']
                    })
        
        # Calculate totals
        total_people = sum(d.get('total_count', 0) for d in daily_data)
        peak_count = max([d.get('peak_count', 0) for d in daily_data], default=0)
        
        # Find peak time with highest count
        peak_time = 'N/A'
        if peak_data:
            max_peak = max(peak_data, key=lambda x: x['count']) if peak_data else None
            if max_peak:
                peak_time = max_peak['time']
        
        busiest_zone = 'N/A'
        if zone_stats.get('zone_rankings'):
            busiest_zone = max(zone_stats['zone_rankings'], key=lambda x: x.get('avg_density', 0), default={'zone': 'N/A'})['zone']
        
        return jsonify({
            'success': True,
            'daily_data': daily_data,
            'alert_summary': alert_summary_list,
            'peak_data': peak_data[-24:],  # Last 24 hours
            'zone_rankings': zone_stats.get('zone_rankings', []),
            'alert_log': daily_alerts[-50:],  # Last 50 alerts
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'total_people': total_people,
            'peak_count': peak_count,
            'peak_time': peak_time,
            'total_alerts': len(daily_alerts),
            'busiest_zone': busiest_zone
        })
        
    except Exception as e:
        print(f"Error generating daily report: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

def get_alert_color(alert_type):
    """Return color for alert type"""
    colors = {
        'overcrowding': '#ef4444',
        'intrusion': '#f59e0b',
        'panic': '#eab308',
        'surge': '#f97316'
    }
    return colors.get(alert_type, '#7AB2B2')
    
def save_daily_report():
    """Generate and save daily report at end of day"""
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Generate report for yesterday
    with app.test_request_context(f'/api/reports/daily?date={yesterday}'):
        response = get_daily_report()
        if response.status_code == 200:
            report_data = response.get_json()
            
            # Save to file
            report_file = os.path.join(REPORTS_DIR, f"{yesterday}.json")
            os.makedirs(REPORTS_DIR, exist_ok=True)
            with open(report_file, 'w') as f:
                json.dump(report_data, f, indent=2)
            
            print(f"Daily report saved for {yesterday}")

if __name__ == '__main__':
    load_cameras()
    
    # Load existing reports
    os.makedirs(REPORTS_DIR, exist_ok=True)

    for camera in cameras:
        start_camera_processing(camera)
    
    print("Starting Flask server on http://localhost:5000")
    print("\nTo add a video file, use the full path or relative path:")
    print("  - Absolute: C:/videos/crowd.mp4")
    print("  - Relative: crowd.mp4 (if file is in the same directory)")
    print("\nDebug endpoint: http://localhost:5000/api/debug/cameras")
    print("\nReports endpoint: http://localhost:5000/api/reports/daily")
    print("\nPress Ctrl+C to stop")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True, use_reloader=False)
