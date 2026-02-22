import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { CookieConsentProvider } from '@context/CookieContext';
import { WordsContextProvider } from '@store/WordsContext';
import App from 'src/components/App';
import './index.scss';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root') as HTMLElement;

const rootElement = (
    <StrictMode>
        <CookieConsentProvider>
            <WordsContextProvider>
                <App />
            </WordsContextProvider>
        </CookieConsentProvider>
    </StrictMode>
);

if (container.hasChildNodes()) {
  hydrateRoot(container, rootElement);
} else {
  createRoot(container).render(rootElement);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
