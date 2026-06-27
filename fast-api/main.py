#fast-api/main.py
import cv2
import numpy as np
import time
import os
import csv
import argparse
from datetime import datetime
from ultralytics import YOLO
import winsound  # For Windows audio alert

# ================= Configuration =================
MODEL_NAME = "yolov8n.pt"  # Nano model for real-time speed
CONFIDENCE_THRESHOLD = 0.5
DENSITY_THRESHOLDS = {
    "Low": 10,     # 0-10
    "Medium": 25,  # 11-25
    "High": 26     # 26+
}
VIDEO_SOURCE = "crowd.mp4"  # Default to video file
LOG_DIR = "logs"
SNAPSHOT_DIR = "snapshots"
ALERT_COOLDOWN = 5  # Seconds between high-density alerts and snapshots
# =================================================

# Parse command line arguments
def parse_arguments():
    parser = argparse.ArgumentParser(description='Crowd Management System')
    parser.add_argument('--source', type=str, default=None, 
                        help='Video source (0 for webcam, or file path, or URL)')
    parser.add_argument('--camera-id', type=int, default=None, 
                        help='Camera ID for identification')
    return parser.parse_args()

# Ensure output directories exist
os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

csv_filepath = os.path.join(LOG_DIR, "crowd_log.csv")
if not os.path.exists(csv_filepath):
    with open(csv_filepath, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Timestamp", "Count", "Density", "Zone A", "Zone B"])

def append_to_csv(count, density, za, zb):
    """Logs the crowd data to a CSV file."""
    with open(csv_filepath, mode='a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([datetime.now().strftime("%Y-%m-%d %H:%M:%S"), count, density, za, zb])

def get_density_level(count):
    """Returns density level string and BGR color based on thresholds."""
    if count <= DENSITY_THRESHOLDS["Low"]:
        return "Low", (0, 255, 0)  # Green
    elif count <= DENSITY_THRESHOLDS["Medium"]:
        return "Medium", (0, 255, 255)  # Yellow
    else:
        return "High", (0, 0, 255)  # Red

def draw_heatmap(frame, centers, max_history=100):
    """Draws a heatmap overlay representing areas with dense presence over time."""
    heatmap_overlay = frame.copy()
    for center in centers[-max_history:]:  # Keep last N positions
        cv2.circle(heatmap_overlay, center, 25, (0, 0, 255), -1)  # Red dots for heat
    
    # Apply blur to make it look like a heat signature
    heatmap_overlay = cv2.GaussianBlur(heatmap_overlay, (99, 99), 0)
    
    # Apply alpha blend to the actual frame
    alpha = 0.4
    cv2.addWeighted(heatmap_overlay, alpha, frame, 1 - alpha, 0, frame)
    return frame

def count_in_zones(centers, width):
    """Calculates counts per zone (Left vs Right half)."""
    zone_a_count = sum(1 for cx, cy in centers if cx < width // 2)
    zone_b_count = sum(1 for cx, cy in centers if cx >= width // 2)
    return zone_a_count, zone_b_count

def draw_zones(frame):
    """Draws visual dividers for zones."""
    h, w = frame.shape[:2]
    # Draw vertical divider line in the middle
    cv2.line(frame, (w//2, 0), (w//2, h), (255, 255, 255), 2)
    return frame

def main(video_source=None, camera_id=None):
    # Use provided video source or default
    if video_source is None:
        video_source = VIDEO_SOURCE
    
    print(f"Loading YOLO model '{MODEL_NAME}'...")
    model = YOLO(MODEL_NAME)
    
    print(f"Opening video source: {video_source}")
    print(f"Camera ID: {camera_id if camera_id else 'Not specified'}")
    
    # Handle different video source types
    try:
        # Check if it's a video file (has common video extensions)
        is_video_file = False
        if isinstance(video_source, str):
            video_extensions = ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg']
            if any(video_source.lower().endswith(ext) for ext in video_extensions):
                is_video_file = True
                print(f"Detected video file: {video_source}")
            elif video_source.isdigit():
                video_source = int(video_source)
                print(f"Using webcam index: {video_source}")
            elif video_source.startswith(('http://', 'https://', 'rtsp://')):
                print(f"Using IP camera stream: {video_source}")
            else:
                # Check if file exists as a video file
                if os.path.exists(video_source):
                    is_video_file = True
                    print(f"Using video file: {video_source}")
                else:
                    print(f"Using video source: {video_source}")
        else:
            print(f"Using video source: {video_source}")
    except Exception as e:
        print(f"Error parsing video source: {e}")
    
    cap = cv2.VideoCapture(video_source)
    if not cap.isOpened():
        print(f"Error: Could not open video source: {video_source}")
        print("Please check:")
        print("  - For webcam: Make sure no other app is using the camera")
        print("  - For IP camera: Check the URL and network connection")
        print("  - For video file: Check if the file exists")
        return

    # Get video properties for better handling
    if isinstance(video_source, str) and (video_source.endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg')) or os.path.exists(video_source)):
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"Video file loaded: {total_frames} frames at {fps:.2f} FPS")
    
    # Base targets for scaling to maintain fast processing
    target_width = 800
    
    last_alert_time = 0
    last_log_time = time.time()
    centers_history = []
    frame_count = 0
    
    print("System running. Press 'q' to exit.")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            # If it's a video file, loop back to beginning
            if isinstance(video_source, str) and (video_source.endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg')) or os.path.exists(video_source)):
                print("End of video file reached. Looping...")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                print("End of video stream or error capturing frame.")
                break
            
        # Resize frame to speed up inference
        h, w = frame.shape[:2]
        aspect_ratio = h / w
        target_height = int(target_width * aspect_ratio)
        frame = cv2.resize(frame, (target_width, target_height))
        h, w = frame.shape[:2]
        
        frame_count += 1
        
        # For video files, show progress every 100 frames
        if frame_count % 100 == 0 and isinstance(video_source, str) and (video_source.endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg')) or os.path.exists(video_source)):
            current_frame = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if total_frames > 0:
                progress = (current_frame / total_frames) * 100
                print(f"Processing video: {progress:.1f}% complete")

        # Run YOLO inference
        results = model(frame, verbose=False)
        
        person_count = 0
        current_centers = []
        bounding_boxes = []
        
        # Process detections
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                
                # YOLO COCO dataset class 0 is "person"
                if cls_id == 0 and conf >= CONFIDENCE_THRESHOLD:
                    person_count += 1
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    
                    # Compute center for heatmap & zones
                    cx = (x1 + x2) // 2
                    cy = (y1 + y2) // 2
                    current_centers.append((cx, cy))
                    centers_history.append((cx, cy))
                    bounding_boxes.append(((x1, y1, x2, y2), conf))
        
        # Keep recent centers history manageable for the heatmap (last 150 points)
        if len(centers_history) > 150:
            centers_history = centers_history[-150:]
            
        # Determine overall density level
        density_text, density_color = get_density_level(person_count)
        
        # Zone tracking (Left/Right)
        za, zb = count_in_zones(current_centers, w)
        frame = draw_zones(frame)
        
        # Draw Heatmap
        frame = draw_heatmap(frame, centers_history)
        
        # Draw bounding boxes matching the density color
        for (x1, y1, x2, y2), conf in bounding_boxes:
            cv2.rectangle(frame, (x1, y1), (x2, y2), density_color, 2)
            cv2.putText(frame, f"Person {conf:.2f}", (x1, max(y1-5, 0)), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, density_color, 2)
        
        # Overlay UI Text (Dark background for readability)
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 140), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)
        
        # Text UI
        cv2.putText(frame, f"Total Count: {person_count}", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(frame, f"Density: {density_text}", (20, 80), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, density_color, 2)
        
        zone_info = f"Zone A (Left): {za}  |  Zone B (Right): {zb}"
        cv2.putText(frame, zone_info, (20, 120), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Add camera ID to display if provided
        if camera_id:
            cv2.putText(frame, f"Camera ID: {camera_id}", (w - 150, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # For video files, add frame counter
        if isinstance(video_source, str) and (video_source.endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg')) or os.path.exists(video_source)):
            current_frame = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            if total_frames > 0:
                progress_text = f"Frame: {current_frame}/{total_frames}"
                cv2.putText(frame, progress_text, (w - 200, 60), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Alerts & Snapshots
        current_time = time.time()
        if density_text == "High" and (current_time - last_alert_time) > ALERT_COOLDOWN:
            last_alert_time = current_time
            # Trigger alert sound (Beep for windows: 1000hz, 500ms)
            try:
                winsound.Beep(1000, 500)
                print(f"[!] ALERT: High density detected! {person_count} people")
            except:
                # If winsound fails (non-Windows), just print
                print(f"[!] ALERT: High density detected! {person_count} people")
            
            # Save snapshot
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            camera_suffix = f"_cam{camera_id}" if camera_id else ""
            snap_path = os.path.join(SNAPSHOT_DIR, f"high_density_{timestamp_str}{camera_suffix}.jpg")
            cv2.imwrite(snap_path, frame)
            print(f"Snapshot saved to {snap_path}")
            
        # Log to CSV roughly every 5 seconds
        if current_time - last_log_time >= 5:
            last_log_time = current_time
            append_to_csv(person_count, density_text, za, zb)
            
        # Display the result
        cv2.imshow("Crowd Management System", frame)
        
        # For video files, use a delay based on video FPS for real-time playback
        if isinstance(video_source, str) and (video_source.endswith(('.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg')) or os.path.exists(video_source)):
            fps = cap.get(cv2.CAP_PROP_FPS)
            if fps > 0:
                delay = int(1000 / fps)
                if cv2.waitKey(delay) & 0xFF == ord('q'):
                    break
            else:
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
        else:
            # For live streams, use minimal delay
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print("System shut down successfully.")

if __name__ == "__main__":
    args = parse_arguments()
    
    # Use command line arguments if provided, otherwise use defaults
    video_source = args.source if args.source is not None else VIDEO_SOURCE
    camera_id = args.camera_id
    
    main(video_source=video_source, camera_id=camera_id)