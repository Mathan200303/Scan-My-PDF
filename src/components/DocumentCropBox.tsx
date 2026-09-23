import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';
import { Move } from 'lucide-react-native';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DocumentCropBoxProps {
  containerWidth: number;
  containerHeight: number;
  cropRect: CropRect;
  onCropChange: (rect: CropRect) => void;
  accentColor?: string;
}

const HANDLE_TOUCH_SIZE = 52;
const HANDLE_VISUAL_SIZE = 26;
const MIN_SIZE = 60;

export const DocumentCropBox: React.FC<DocumentCropBoxProps> = ({
  containerWidth,
  containerHeight,
  cropRect,
  onCropChange,
  accentColor = '#3B82F6',
}) => {
  const rectRef = useRef<CropRect>(cropRect);
  rectRef.current = cropRect;

  const boundsRef = useRef({ w: containerWidth, h: containerHeight });
  boundsRef.current = { w: containerWidth, h: containerHeight };

  const startRectRef = useRef<CropRect>(cropRect);

  // Center pan: moves the entire crop box across the document
  const centerResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRectRef.current = { ...rectRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const start = startRectRef.current;
        const maxW = boundsRef.current.w;
        const maxH = boundsRef.current.h;

        const newX = Math.max(0, Math.min(maxW - start.width, start.x + gesture.dx));
        const newY = Math.max(0, Math.min(maxH - start.height, start.y + gesture.dy));

        const updated = {
          ...start,
          x: Math.round(newX),
          y: Math.round(newY),
        };
        rectRef.current = updated;
        onCropChange(updated);
      },
    })
  ).current;

  // Corner responders
  const createCornerResponder = (corner: 'tl' | 'tr' | 'br' | 'bl') => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRectRef.current = { ...rectRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const start = startRectRef.current;
        const maxW = boundsRef.current.w;
        const maxH = boundsRef.current.h;

        let { x, y, width, height } = start;

        if (corner === 'tl') {
          const right = start.x + start.width;
          const bottom = start.y + start.height;
          const candidateX = Math.max(0, Math.min(right - MIN_SIZE, start.x + gesture.dx));
          const candidateY = Math.max(0, Math.min(bottom - MIN_SIZE, start.y + gesture.dy));
          x = candidateX;
          y = candidateY;
          width = right - candidateX;
          height = bottom - candidateY;
        } else if (corner === 'tr') {
          const left = start.x;
          const bottom = start.y + start.height;
          const candidateRight = Math.min(maxW, Math.max(left + MIN_SIZE, start.x + start.width + gesture.dx));
          const candidateY = Math.max(0, Math.min(bottom - MIN_SIZE, start.y + gesture.dy));
          y = candidateY;
          width = candidateRight - left;
          height = bottom - candidateY;
        } else if (corner === 'br') {
          const left = start.x;
          const top = start.y;
          const candidateRight = Math.min(maxW, Math.max(left + MIN_SIZE, start.x + start.width + gesture.dx));
          const candidateBottom = Math.min(maxH, Math.max(top + MIN_SIZE, start.y + start.height + gesture.dy));
          width = candidateRight - left;
          height = candidateBottom - top;
        } else if (corner === 'bl') {
          const right = start.x + start.width;
          const top = start.y;
          const candidateX = Math.max(0, Math.min(right - MIN_SIZE, start.x + gesture.dx));
          const candidateBottom = Math.min(maxH, Math.max(top + MIN_SIZE, start.y + start.height + gesture.dy));
          x = candidateX;
          width = right - candidateX;
          height = candidateBottom - top;
        }

        const updated = {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        };
        rectRef.current = updated;
        onCropChange(updated);
      },
    });
  };

  // Edge responders
  const createEdgeResponder = (edge: 'top' | 'bottom' | 'left' | 'right') => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRectRef.current = { ...rectRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        const start = startRectRef.current;
        const maxW = boundsRef.current.w;
        const maxH = boundsRef.current.h;

        let { x, y, width, height } = start;

        if (edge === 'top') {
          const bottom = start.y + start.height;
          const candidateY = Math.max(0, Math.min(bottom - MIN_SIZE, start.y + gesture.dy));
          y = candidateY;
          height = bottom - candidateY;
        } else if (edge === 'bottom') {
          const top = start.y;
          const candidateBottom = Math.min(maxH, Math.max(top + MIN_SIZE, start.y + start.height + gesture.dy));
          height = candidateBottom - top;
        } else if (edge === 'left') {
          const right = start.x + start.width;
          const candidateX = Math.max(0, Math.min(right - MIN_SIZE, start.x + gesture.dx));
          x = candidateX;
          width = right - candidateX;
        } else if (edge === 'right') {
          const left = start.x;
          const candidateRight = Math.min(maxW, Math.max(left + MIN_SIZE, start.x + start.width + gesture.dx));
          width = candidateRight - left;
        }

        const updated = {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        };
        rectRef.current = updated;
        onCropChange(updated);
      },
    });
  };

  const tlResponder = useRef(createCornerResponder('tl')).current;
  const trResponder = useRef(createCornerResponder('tr')).current;
  const brResponder = useRef(createCornerResponder('br')).current;
  const blResponder = useRef(createCornerResponder('bl')).current;

  const topEdgeResponder = useRef(createEdgeResponder('top')).current;
  const bottomEdgeResponder = useRef(createEdgeResponder('bottom')).current;
  const leftEdgeResponder = useRef(createEdgeResponder('left')).current;
  const rightEdgeResponder = useRef(createEdgeResponder('right')).current;

  const { x, y, width, height } = cropRect;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { width: containerWidth, height: containerHeight },
      ]}
      pointerEvents="box-none"
    >
      {/* 4 Shaded Dimming Backdrop Panels */}
      {/* Top panel */}
      <View
        style={[
          styles.backdrop,
          {
            top: 0,
            left: 0,
            width: containerWidth,
            height: Math.max(0, y),
          },
        ]}
      />
      {/* Bottom panel */}
      <View
        style={[
          styles.backdrop,
          {
            top: y + height,
            left: 0,
            width: containerWidth,
            height: Math.max(0, containerHeight - (y + height)),
          },
        ]}
      />
      {/* Left panel */}
      <View
        style={[
          styles.backdrop,
          {
            top: y,
            left: 0,
            width: Math.max(0, x),
            height: height,
          },
        ]}
      />
      {/* Right panel */}
      <View
        style={[
          styles.backdrop,
          {
            top: y,
            left: x + width,
            width: Math.max(0, containerWidth - (x + width)),
            height: height,
          },
        ]}
      />

      {/* Main Center Draggable Crop Box Frame */}
      <View
        {...centerResponder.panHandlers}
        collapsable={false}
        style={[
          styles.cropBox,
          {
            left: x,
            top: y,
            width: width,
            height: height,
            borderColor: accentColor,
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
          },
        ]}
      >
        {/* Rule of Thirds Grid Lines */}
        <View style={[styles.gridLineH, { top: '33.3%' }]} />
        <View style={[styles.gridLineH, { top: '66.6%' }]} />
        <View style={[styles.gridLineV, { left: '33.3%' }]} />
        <View style={[styles.gridLineV, { left: '66.6%' }]} />

        {/* Center Move Drag Indicator Icon Badge */}
        <View style={styles.centerMoveBadge} pointerEvents="none">
          <View style={styles.centerMovePill}>
            <Move size={14} color="#FFFFFF" />
            <Text style={styles.centerMoveText}>Drag Center</Text>
          </View>
        </View>
      </View>

      {/* 4 Sibling Edge Handles (Positioned on top for smooth dragging) */}
      {/* Top Edge */}
      <View
        {...topEdgeResponder.panHandlers}
        collapsable={false}
        style={[
          styles.edgeTouchH,
          {
            left: x + width / 2 - 35,
            top: y - 18,
          },
        ]}
      >
        <View style={[styles.edgeBarH, { backgroundColor: accentColor }]} />
      </View>

      {/* Bottom Edge */}
      <View
        {...bottomEdgeResponder.panHandlers}
        collapsable={false}
        style={[
          styles.edgeTouchH,
          {
            left: x + width / 2 - 35,
            top: y + height - 18,
          },
        ]}
      >
        <View style={[styles.edgeBarH, { backgroundColor: accentColor }]} />
      </View>

      {/* Left Edge */}
      <View
        {...leftEdgeResponder.panHandlers}
        collapsable={false}
        style={[
          styles.edgeTouchV,
          {
            left: x - 18,
            top: y + height / 2 - 35,
          },
        ]}
      >
        <View style={[styles.edgeBarV, { backgroundColor: accentColor }]} />
      </View>

      {/* Right Edge */}
      <View
        {...rightEdgeResponder.panHandlers}
        collapsable={false}
        style={[
          styles.edgeTouchV,
          {
            left: x + width - 18,
            top: y + height / 2 - 35,
          },
        ]}
      >
        <View style={[styles.edgeBarV, { backgroundColor: accentColor }]} />
      </View>

      {/* 4 Corner Knobs (Highest zIndex) */}
      {/* Top-Left */}
      <View
        {...tlResponder.panHandlers}
        collapsable={false}
        style={[
          styles.cornerTouch,
          {
            left: x - HANDLE_TOUCH_SIZE / 2,
            top: y - HANDLE_TOUCH_SIZE / 2,
          },
        ]}
      >
        <View style={[styles.cornerKnob, { borderColor: accentColor }]}>
          <View style={[styles.cornerKnobInner, { backgroundColor: accentColor }]} />
        </View>
      </View>

      {/* Top-Right */}
      <View
        {...trResponder.panHandlers}
        collapsable={false}
        style={[
          styles.cornerTouch,
          {
            left: x + width - HANDLE_TOUCH_SIZE / 2,
            top: y - HANDLE_TOUCH_SIZE / 2,
          },
        ]}
      >
        <View style={[styles.cornerKnob, { borderColor: accentColor }]}>
          <View style={[styles.cornerKnobInner, { backgroundColor: accentColor }]} />
        </View>
      </View>

      {/* Bottom-Right */}
      <View
        {...brResponder.panHandlers}
        collapsable={false}
        style={[
          styles.cornerTouch,
          {
            left: x + width - HANDLE_TOUCH_SIZE / 2,
            top: y + height - HANDLE_TOUCH_SIZE / 2,
          },
        ]}
      >
        <View style={[styles.cornerKnob, { borderColor: accentColor }]}>
          <View style={[styles.cornerKnobInner, { backgroundColor: accentColor }]} />
        </View>
      </View>

      {/* Bottom-Left */}
      <View
        {...blResponder.panHandlers}
        collapsable={false}
        style={[
          styles.cornerTouch,
          {
            left: x - HANDLE_TOUCH_SIZE / 2,
            top: y + height - HANDLE_TOUCH_SIZE / 2,
          },
        ]}
      >
        <View style={[styles.cornerKnob, { borderColor: accentColor }]}>
          <View style={[styles.cornerKnobInner, { backgroundColor: accentColor }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  centerMoveBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerMovePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  centerMoveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
    letterSpacing: 0.2,
  },
  cornerTouch: {
    position: 'absolute',
    width: HANDLE_TOUCH_SIZE,
    height: HANDLE_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  cornerKnob: {
    width: HANDLE_VISUAL_SIZE,
    height: HANDLE_VISUAL_SIZE,
    borderRadius: HANDLE_VISUAL_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  cornerKnobInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  edgeTouchH: {
    position: 'absolute',
    width: 70,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  edgeTouchV: {
    position: 'absolute',
    width: 36,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  edgeBarH: {
    width: 34,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  edgeBarV: {
    width: 6,
    height: 34,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
});
