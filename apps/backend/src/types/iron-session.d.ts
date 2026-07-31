import 'iron-session';

declare module 'iron-session' {
  interface IronSessionData {
    user_id?: string;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: any;
  }
}
