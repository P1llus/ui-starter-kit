import {
  EuiButtonIcon,
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiListGroup,
  EuiListGroupItem,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useColorModeStore } from '@/theme';
import { NAV } from './nav';

/**
 * A neutral placeholder shell: header, side nav, main area. The approved layout board in
 * design/ replaces it during the foundation build.
 */
export function AppShell() {
  const { euiTheme } = useEuiTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorModeStore();

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <div css={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <EuiHeader position="static">
        <EuiHeaderSection>
          <EuiHeaderSectionItem>
            <EuiTitle size="xxs">
              <h1 css={{ paddingInline: euiTheme.size.s }}>Prototype</h1>
            </EuiTitle>
          </EuiHeaderSectionItem>
        </EuiHeaderSection>
        <EuiHeaderSection side="right">
          <EuiHeaderSectionItem>
            <EuiButtonIcon
              iconType={colorMode === 'dark' ? 'sun' : 'moon'}
              aria-label="Switch light or dark mode"
              color="text"
              onClick={toggleColorMode}
              data-test-subj="themeToggle"
            />
          </EuiHeaderSectionItem>
        </EuiHeaderSection>
      </EuiHeader>
      <div css={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <nav
          aria-label="Main"
          css={{
            width: 220,
            flexShrink: 0,
            padding: euiTheme.size.s,
            borderRight: euiTheme.border.thin,
            background: euiTheme.colors.backgroundBasePlain,
          }}
        >
          <EuiListGroup maxWidth={false}>
            {NAV.map((item) => (
              <EuiListGroupItem
                key={item.to}
                label={item.label}
                iconType={item.icon}
                href={item.to}
                isActive={isActive(item.to)}
                onClick={(e) => {
                  e.preventDefault();
                  navigate({ to: item.to });
                }}
                data-test-subj={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </EuiListGroup>
        </nav>
        <main css={{ flex: 1, minWidth: 0, background: euiTheme.colors.backgroundBasePlain }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
