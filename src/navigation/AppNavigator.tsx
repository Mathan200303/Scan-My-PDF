import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { BottomTabs } from './BottomTabs';
import { CameraScreen } from '../screens/CameraScreen';
import { CropScreen } from '../screens/CropScreen';
import { ScanEditorScreen } from '../screens/ScanEditorScreen';
import { MultiPageScreen } from '../screens/MultiPageScreen';
import { DocumentViewerScreen } from '../screens/DocumentViewerScreen';
import { ImageToPdfScreen } from '../screens/ImageToPdfScreen';
import { PdfToImageScreen } from '../screens/PdfToImageScreen';
import { MergePdfScreen } from '../screens/MergePdfScreen';
import { SplitPdfScreen } from '../screens/SplitPdfScreen';
import { PageManagerScreen } from '../screens/PageManagerScreen';
import { CoverPageScreen } from '../screens/CoverPageScreen';
import { WatermarkScreen } from '../screens/WatermarkScreen';
import { PageNumberScreen } from '../screens/PageNumberScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { isDark, colors } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="MainTabs" component={BottomTabs} options={{ animation: 'fade' }} />

        {/* Scanner Flow */}
        <Stack.Screen
          name="CameraScreen"
          component={CameraScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="CropScreen" component={CropScreen} />
        <Stack.Screen name="ScanEditor" component={ScanEditorScreen} />
        <Stack.Screen name="MultiPage" component={MultiPageScreen} />

        {/* Viewer */}
        <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} />

        {/* PDF & Image Conversion Tools */}
        <Stack.Screen name="ImageToPdf" component={ImageToPdfScreen} />
        <Stack.Screen name="PdfToImage" component={PdfToImageScreen} />

        {/* PDF Tools */}
        <Stack.Screen name="MergePdf" component={MergePdfScreen} />
        <Stack.Screen name="SplitPdf" component={SplitPdfScreen} />
        <Stack.Screen name="PageManager" component={PageManagerScreen} />
        <Stack.Screen name="CoverPage" component={CoverPageScreen} />
        <Stack.Screen name="Watermark" component={WatermarkScreen} />
        <Stack.Screen name="PageNumber" component={PageNumberScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

