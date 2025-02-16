// backend/src/types/express/index.d.ts changes for user authentication
import { User } from '@supabase/supabase-js';
import { ParamsDictionary } from 'express-serve-static-core'; // Import these from express-serve-static-core and qs
import { ParsedQs } from 'qs';

declare global {
  namespace Express {
    interface Request<P extends ParamsDictionary = ParamsDictionary, // Add generic type parameters
      ResBody = any,
      ReqBody = any,
      ReqQuery extends ParsedQs = ParsedQs,
      Locals extends Record<string, any> = Record<string, any>> {
      user?: User | null; // Keep user property, but use User | null for type safety
    }
  }
}

export {};