import { useNavigate } from 'react-router-dom';
import { hideBackButton, onBackButtonClick, showBackButton, isTMA } from '@telegram-apps/sdk-react';
import { type PropsWithChildren, useEffect } from 'react';

export function Page({ children, back = true }: PropsWithChildren<{
  /**
   * True if it is allowed to go back from this page.
   */
  back?: boolean
}>) {
  const navigate = useNavigate();

  useEffect(() => {
    if (back) {
      // Check if we're in a Telegram Mini App environment before trying to show the back button
      isTMA('complete').then((isTelegramApp) => {
        if (isTelegramApp) {
          showBackButton();
          return onBackButtonClick(() => {
            navigate(-1);
          });
        }
        // If not in Telegram Mini App, don't call hideBackButton() as it's not available
      }).catch(() => {
        // If there's an error checking the environment, don't call hideBackButton() as it's not available
      });
    } else {
      // Only try to hide the back button if we're in a Telegram Mini App
      isTMA('complete').then((isTelegramApp) => {
        if (isTelegramApp) {
          hideBackButton();
        }
      }).catch(() => {
        // If there's an error checking the environment, don't call hideBackButton()
      });
    }
  }, [back, navigate]);

  return <>{children}</>;
}