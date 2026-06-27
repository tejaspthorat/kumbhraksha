# Objective

Completely redesign the existing React Native application into an ultra-premium mobile experience that feels comparable to Apple's first-party applications.

DO NOT change any application functionality, business logic, APIs, backend integration, navigation structure, BLE functionality, reporting flow or features.

Only redesign the UI, UX, interactions, layout hierarchy, typography, spacing, animations and visual system.

The final application should look like something designed by Apple's Human Interface Design team while maintaining the mission-critical emergency nature of the application.

The implementation plan defines every screen and feature.

The DESIGN.md defines the design tokens.

Use BOTH files as the source of truth.

---

# Overall Design Philosophy

The UI should combine

• Apple iOS 26
• Apple Wallet
• Apple Find My
• Apple Health
• Apple Journal
• Apple Maps
• VisionOS Design Language
• Liquid Glass
• Dynamic Island interaction philosophy
• SF Symbols style iconography
• Premium minimalism

NOT

• Material Design
• Bootstrap
• Generic Android UI
• Dashboard style
• Card overload
• Bright gradients everywhere
• Cheap glassmorphism

Everything should feel calm, elegant, premium, spacious and highly polished.

Every screen should have a purpose.

Every animation should feel physically believable.

Every interaction should feel effortless.

---

# Use Existing Design Tokens

Use the typography, spacing, animations and colors from DESIGN.md.

Keep

Typography hierarchy

Spacing system

Radius system

Glow utilities

Animation timing

Container spacing

Color palette

Do NOT invent a new design system.

Instead modernize the implementation using those design tokens.

---

# Support Both Themes

Build complete Light Mode.

Build complete Dark Mode.

Both should look equally premium.

Dark mode should be true black (#000000) rather than dark gray.

Light mode should feel like Apple's native apps.

Both themes should transition smoothly.

Never invert colors incorrectly.

Every component must have dedicated light and dark styling.

---

# Apple-Level Visual Language

The application should feel alive.

Large typography

Generous spacing

Rounded corners

Depth

Floating cards

Soft shadows

Beautiful blur

Large hero headers

Large navigation titles

Adaptive layouts

Fluid scrolling

Micro interactions

Large tap targets

Floating action buttons

Glass overlays

Animated sheets

Native transitions

Native gestures

Haptic feedback

Context menus

Swipe actions

Pull interactions

Search everywhere

Scrollable cards

Smooth spring animations

Interactive blur

Dynamic color changes

Status indicators

Animated icons

Live badges

Native segmented controls

Large image headers

Beautiful onboarding

Premium empty states

Elegant loading skeletons

No visual clutter.

---

# Navigation

Use native iOS navigation.

Large collapsing navigation bars.

Interactive back gesture.

Floating tab bar.

Blurred translucent navigation.

Rounded tab bar.

Animated active indicator.

Tab icons should animate.

Navigation hierarchy should feel identical to Find My.

---

# Screen Layout

Every screen should have

Hero Header

Large title

Subtitle

Context information

Primary action

Secondary actions

Scrollable content

Sticky CTA when necessary

Safe area support

Proper spacing

Dynamic padding

Comfortable reading width

No cramped UI.

---

# Cards

Replace every current card.

Cards should look similar to Apple Wallet.

Large radius

Soft shadow

Hairline borders

Layered surfaces

Floating appearance

Proper depth hierarchy

Interactive scaling

Spring animation

Press feedback

Hover states (tablet)

Blurred backgrounds where appropriate.

---

# Buttons

Primary

Large pill

Bold

Easy to tap

Filled

Animated

Secondary

Subtle

Bordered

Glass style

Icon buttons

Circular

Blurred

Animated

Destructive

Red

Elegant

Never use flat buttons.

---

# Typography

Follow DESIGN.md typography.

Increase hierarchy dramatically.

Hero Title

Extra Large

Section Title

Large

Card Title

Medium

Body

Readable

Metadata

Small

Status

Monospaced

Never use random font weights.

Everything should feel editorial.

---

# Colors

Use monochrome base.

Accent colors only for

Emergency

Success

Location

Notifications

BLE

Status

Avoid colorful interfaces.

Less is more.

---

# Motion Design

Every interaction should animate.

Card appears

Spring

Navigation push

Native

Modal

Bottom sheet

Tab switch

Fluid

Button tap

Scale 0.97

Lists

Staggered

Alerts

Pulse

Maps

Smooth

Sheets

Interactive drag

Page transition

Parallax

No abrupt animations.

Duration

150-250ms

Spring physics

Native easing.

---

# Apple Glass Components

Use Liquid Glass carefully.

Navigation

Bottom sheets

Floating buttons

Action menus

Context menus

Search

Segmented controls

Map overlays

Do NOT overuse blur.

Everything should remain readable.

---

# Home Screen

Completely redesign.

Hero greeting

Current location

Live protection status

BLE status

Emergency state

Nearby alerts

Witness alerts

Area alerts

Priority cards

Recent activity

Live statistics

Map preview

Quick report button

Floating action menu

Everything should scroll naturally.

---

# Alert Cards

Premium redesign.

Large photo

Rounded corners

Person name

Age

Time

Distance

Priority indicator

Status chip

Action buttons

Interactive expansion

Swipe actions

Expandable details

Animated urgency indicator

No harsh borders.

---

# Report Missing Person

Multi-step premium wizard.

Progress indicator

Large image picker

Beautiful inputs

Apple style pickers

Segment controls

Date wheels

Dropdown sheets

Location picker

Review screen

Submission animation

Success state

---

# Report Sighting

Camera-first experience.

Live camera

Detection overlay

Minimal UI

Large shutter button

Bottom information sheet

Easy reporting

Native confirmation.

---

# Map Screen

Inspired by Apple Maps.

Floating cards

Bottom sheet

Live location

Animated markers

Cluster animations

Layer selector

Floating controls

Search

Navigation

Live status

Beautiful map blur.

---

# Profile

Apple Settings style.

Grouped sections

Rounded cards

Account

Family

BLE

Permissions

Privacy

Notifications

Appearance

Language

Support

About

Everything in grouped lists.

---

# Family Screen

Large family cards.

Profile photos

Live location

Status indicators

Invite button

Expandable members

Emergency shortcuts

Timeline

Shared protection status.

---

# Notifications

Apple notification cards.

Grouped

Beautiful

Interactive

Swipe

Context menu

Priority coloring

Read animations.

---

# Empty States

Illustrations

Minimal

Premium

Helpful

Encouraging

Never blank screens.

---

# Loading

Skeleton loading

Shimmer

Progressive loading

Animated placeholders

Blur transitions.

---

# Icons

Use SF Symbols style.

Rounded

Consistent

Minimal

Thin weight

Adaptive.

---

# Gestures

Swipe

Pull

Drag

Long press

Context menu

Interactive dismiss

Interactive sheet

Edge swipe

Everything should feel native.

---

# Haptics

Soft

Medium

Heavy

Notification

Selection

Success

Failure

Navigation

Use everywhere meaningful.

---

# Accessibility

Dynamic Type

Large touch targets

VoiceOver labels

Contrast

Reduced motion

Screen reader support

High contrast mode

Keyboard support

Tablet support.

---

# Responsiveness

Support

iPhone SE

iPhone 16

iPhone Pro Max

Android phones

Foldables

Tablets

Landscape

Portrait.

---

# Deliverables

Redesign every screen from the implementation plan.

Do NOT skip any screen.

Redesign

Onboarding

Home

Alert Feed

Report Missing

Report Sighting

Map

Confirmation

Family

Profile

Settings

Notifications

Loading

Empty States

Error States

Success Screens

Permission Screens

Authentication

OTP

Splash

Every modal

Every sheet

Every popup

Every dialog

Every component

Every card

Every button

Every input

Every list item

Every navigation element

Every animation.

---

# Code Quality

Use React Native best practices.

Component-driven architecture.

Reusable design system.

Theme provider.

Light/Dark mode.

Responsive layouts.

Accessibility.

TypeScript.

React Native Reanimated.

React Native Gesture Handler.

FlashList.

React Native Skia where useful.

Lottie only where appropriate.

No inline styling.

No duplicated code.

Production-ready implementation.

The result should look like an application that Apple itself could showcase during WWDC while maintaining the emergency response workflow defined in the implementation plan.