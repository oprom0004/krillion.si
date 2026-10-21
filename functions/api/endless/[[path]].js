import { handleStatistics } from '../../../server/endless-statistics.mjs';
export function onRequest({request,env}) { return handleStatistics(request,env); }
