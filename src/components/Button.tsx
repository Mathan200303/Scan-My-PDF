import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Spacing } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  let bgColor = colors.primary;
  let textColor = '#FFFFFF';
  let borderColor = 'transparent';

  if (variant === 'secondary') {
    bgColor = colors.primaryLight;
    textColor = colors.primary;
  } else if (variant === 'outline') {
    bgColor = 'transparent';
    textColor = colors.text;
    borderColor = colors.border;
  } else if (variant === 'danger') {
    bgColor = colors.danger;
    textColor = '#FFFFFF';
  } else if (variant === 'ghost') {
    bgColor = 'transparent';
    textColor = colors.primary;
  }

  const height = size === 'small' ? 36 : size === 'large' ? 52 : 44;
  const paddingH = size === 'small' ? Spacing.md : size === 'large' ? Spacing.xl : Spacing.lg;
  const fontSize = size === 'small' ? 13 : size === 'large' ? 16 : 14;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? (variant === 'ghost' ? 'transparent' : colors.border) : bgColor,
          borderColor,
          height,
          paddingHorizontal: paddingH,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.text,
              {
                color: disabled ? colors.textMuted : textColor,
                fontSize,
                marginLeft: icon ? Spacing.sm : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
  },
});

