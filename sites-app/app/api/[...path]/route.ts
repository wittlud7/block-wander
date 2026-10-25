import {env} from 'cloudflare:workers';
import {createAPI} from '../../../lib/ranking-service.mjs';
import {d1Store} from '../../../lib/d1-store';
export const dynamic='force-dynamic';
async function handle(request:Request){if(!env.DB)return Response.json({error:'排名服务尚未连接'},{status:503});return createAPI(d1Store(env.DB),{trustSitesIdentity:true})(request);}
export const GET=handle,POST=handle,DELETE=handle;
