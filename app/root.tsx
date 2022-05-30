import { type MetaFunction } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import componentStyles from './styles/components.css';
import styles from './styles/root.css';

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Simple News',
  viewport: 'width=device-width,initial-scale=1',
});

export function links() {
  return [
    { rel: 'stylesheet', href: styles },
    { rel: 'stylesheet', href: componentStyles },
  ];
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <svg style={{ display: 'none' }} version="2.0">
          <defs>
            <symbol
              id="sn-logo"
              viewBox="0 0 1000 1000"
              style={{
                fillRule: 'evenodd',
                clipRule: 'evenodd',
                strokeLinejoin: 'round',
                strokeMiterlimit: 2,
                fill: 'currentcolor',
              }}
              version="2.0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <style>{`@media (prefers-color-scheme: dark) {path{fill:white; stroke:white;}}`}</style>
              <g transform="matrix(0.486202,0,0,-0.486202,157.669,842.287)">
                <path d="M384,192C384,138.667 365.333,93.333 328,56C290.667,18.667 245.333,0 192,0C138.667,0 93.333,18.667 56,56C18.667,93.333 0,138.667 0,192C0,245.333 18.667,290.667 56,328C93.333,365.333 138.667,384 192,384C245.333,384 290.667,365.333 328,328C365.333,290.667 384,245.333 384,192ZM896,69C897.333,50.333 891.667,34.333 879,21C867,7 851.333,0 832,0L697,0C680.333,0 666,5.5 654,16.5C642,27.5 635.333,41.333 634,58C619.333,210.667 557.833,341.167 449.5,449.5C341.167,557.833 210.667,619.333 58,634C41.333,635.333 27.5,642 16.5,654C5.5,666 0,680.333 0,697L0,832C0,851.333 7,867 21,879C32.333,890.333 46.667,896 64,896L69,896C175.667,887.333 277.667,860.5 375,815.5C472.333,770.5 558.667,710 634,634C710,558.667 770.5,472.333 815.5,375C860.5,277.667 887.333,175.667 896,69ZM1408,67C1409.33,49 1403.33,33.333 1390,20C1378,6.667 1362.67,0 1344,0L1201,0C1183.67,0 1168.83,5.833 1156.5,17.5C1144.17,29.167 1137.67,43.333 1137,60C1129,203.333 1095.33,339.5 1036,468.5C976.667,597.5 899.5,709.5 804.5,804.5C709.5,899.5 597.5,976.667 468.5,1036C339.5,1095.33 203.333,1129.33 60,1138C43.333,1138.67 29.167,1145.17 17.5,1157.5C5.833,1169.83 0,1184.33 0,1201L0,1344C0,1362.67 6.667,1378 20,1390C32,1402 46.667,1408 64,1408L67,1408C241.667,1399.33 408.833,1359.33 568.5,1288C728.167,1216.67 870,1118.67 994,994C1118.67,870 1216.67,728.167 1288,568.5C1359.33,408.833 1399.33,241.667 1408,67Z" />
              </g>
            </symbol>
          </defs>
        </svg>
        <div className="App">
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
