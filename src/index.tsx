import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { CookieConsentProvider } from '@context/CookieContext';
import { WordsContextProvider } from '@store/WordsContext';
import App from 'src/components/App';
import './index.scss';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <StrictMode>
        <CookieConsentProvider>
            <WordsContextProvider>
                <App />
            </WordsContextProvider>
        </CookieConsentProvider>
    </StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
