import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  HelpCircle,
  X,
  Eye,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface DialogAction {
  label: string;
  onPress: () => void;
  primary?: boolean;
  destructive?: boolean;
  icon?: any;
}

interface ModernDialogProps {
  visible: boolean;
  type?: 'success' | 'error' | 'info' | 'confirm';
  title: string;
  message: string;
  actions: DialogAction[];
  onClose: () => void;
}

export const ModernDialog: React.FC<ModernDialogProps> = ({
  visible,
  type = 'info',
  title,
  message,
  actions,
  onClose,
}) => {
  const { colors } = useTheme();

  const getHeaderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={32} color="#10B981" />;
      case 'error':
        return <AlertCircle size={32} color="#EF4444" />;
      case 'confirm':
        return <HelpCircle size={32} color="#F59E0B" />;
      case 'info':
      default:
        return <Info size={32} color="#3B82F6" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.12)';
      case 'error':
        return 'rgba(239, 68, 68, 0.12)';
      case 'confirm':
        return 'rgba(245, 158, 11, 0.12)';
      case 'info':
      default:
        return 'rgba(59, 130, 246, 0.12)';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(3, 7, 18, 0.75)' }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Close X button */}
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.closeBtn}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Icon Badge */}
          <View style={[styles.iconContainer, { backgroundColor: getIconBg() }]}>
            {getHeaderIcon()}
          </View>

          {/* Title & Message without Emojis */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsColumn}>
            {actions.map((act, index) => {
              const isPrimary = act.primary ?? (index === 0);
              const IconComp = act.icon;
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      act.onPress();
                    }, 150);
                  }}
                  style={[
                    styles.actionButton,
                    isPrimary
                      ? [styles.primaryBtn, { backgroundColor: act.destructive ? '#EF4444' : colors.primary }]
                      : [styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.inputBg }],
                  ]}
                >
                  {IconComp ? (
                    <IconComp
                      size={16}
                      color={isPrimary ? '#FFFFFF' : colors.text}
                      style={{ marginRight: 6 }}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.btnText,
                      {
                        color: isPrimary ? '#FFFFFF' : colors.text,
                        fontWeight: isPrimary ? '700' : '600',
                      },
                    ]}
                  >
                    {act.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: 4,
    zIndex: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actionsColumn: {
    width: '100%',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  primaryBtn: {
    elevation: 2,
  },
  secondaryBtn: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 14,
  },
});

