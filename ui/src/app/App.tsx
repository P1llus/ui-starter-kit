import { useEffect } from 'react';
import { EuiProvider, type EuiProviderProps } from '@elastic/eui';
import { EuiThemeBorealis } from '@elastic/eui-theme-borealis';
import { RouterProvider } from '@tanstack/react-router';
import { themeModify, useColorMode } from '@/theme';
import { router } from './router';
import { emotionCache } from './emotionCache';
import './flyouts';

/** One page size everywhere; tables never turn into cards on narrow screens. */
const componentDefaults: EuiProviderProps<unknown>['componentDefaults'] = {
  EuiTablePagination: { itemsPerPage: 25, itemsPerPageOptions: [25, 50, 100] },
  EuiTable: { responsiveBreakpoint: false },
};

export function App() {
  const colorMode = useColorMode();

  useEffect(() => {
    // Lets plain CSS (theme/app.css) and screenshot scripts see the active mode.
    document.documentElement.dataset.colorMode = colorMode;
  }, [colorMode]);

  return (
    <EuiProvider
      cache={emotionCache}
      theme={EuiThemeBorealis}
      colorMode={colorMode}
      modify={themeModify}
      componentDefaults={componentDefaults}
    >
      <RouterProvider router={router} />
    </EuiProvider>
  );
}
