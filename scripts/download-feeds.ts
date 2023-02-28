//
// Download feeds
//

import { startDownloader } from '../src/lib/feed.server.js';
import { setLevel } from '../src/lib/log.js';

setLevel('debug');
startDownloader();
