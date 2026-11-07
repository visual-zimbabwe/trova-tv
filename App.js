import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { BottomSheetProvider } from './src/components/StackBottomSheet';
import { useFonts } from 'expo-font';
import { Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { useDiscoverViewModel } from './src/lib/discoverViewModel';
import { ToastProvider } from './src/context/ToastContext';
import { AlertProvider } from './src/context/AlertContext';
import { BottomNavVisibilityProvider } from './src/context/BottomNavVisibilityContext';
import { useToast } from './src/hooks/useToast';
import { useRequestError } from './src/hooks/useRequestError';
import { useWatchlistController } from './src/hooks/useWatchlistController';
import { useDetailController } from './src/hooks/useDetailController';
import { usePeopleController } from './src/hooks/usePeopleController';
import { useSearchController } from './src/hooks/useSearchController';
import { useHomeSpotlight } from './src/hooks/useHomeSpotlight';
import { TvAppShell } from './src/tv/TvAppShell';

enableScreens(true);

const FONT_MAP = {
  Manrope_700Bold,
  Manrope_800ExtraBold,
  Inter_400Regular,
  Inter_600SemiBold,
  PlayfairDisplay_700Bold_Italic,
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#040301' }}>
      <ThemeProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <AlertProvider>
              <BottomSheetProvider>
                <BottomNavVisibilityProvider>
                  <TrovaTvApp />
                </BottomNavVisibilityProvider>
              </BottomSheetProvider>
            </AlertProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function TrovaTvApp() {
  useFonts(FONT_MAP);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
  }, []);

  const { showToast } = useToast();
  const requestError = useRequestError({ showToast });
  const { offlineBanner, setOfflineBanner, handleRequestError } = requestError;

  const watchlistCtl = useWatchlistController({ showToast });
  const { syncWatchlistFromResolvedDetail } = watchlistCtl;

  const detailCtl = useDetailController({
    syncWatchlistFromResolvedDetail,
    handleRequestError,
    setOfflineBanner,
  });

  const peopleCtl = usePeopleController({
    openResolvedDetail: detailCtl.openResolvedDetail,
    handleRequestError,
    setOfflineBanner,
  });

  const searchCtl = useSearchController({
    openResolvedDetail: detailCtl.openResolvedDetail,
    handlePersonPress: peopleCtl.handlePersonPress,
    setOfflineBanner,
  });

  const homeSpotlight = useHomeSpotlight(watchlistCtl.watchlist, null);
  const discoverVm = useDiscoverViewModel();

  return (
    <>
      <StatusBar hidden={true} />
      <TvAppShell
        watchlistCtl={watchlistCtl}
        detailCtl={detailCtl}
        peopleCtl={peopleCtl}
        searchCtl={searchCtl}
        discoverVm={discoverVm}
        homeSpotlightItems={homeSpotlight.homeSpotlightItems}
        offlineBanner={offlineBanner}
      />
    </>
  );
}
