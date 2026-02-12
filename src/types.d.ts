import { DefaultSession, DefaultUser } from "next-auth";
import { AdminPermission } from "@/data/admins";

declare module "next-auth" {
  interface Session {
    user: {
      role?: string;
      permissions?: AdminPermission[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    permissions?: AdminPermission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    permissions?: AdminPermission[];
  }
}

declare module 'react-quill-new' {
    import React from 'react';
    export interface ReactQuillProps {
        theme?: string;
        modules?: unknown;
        formats?: string[];
        value?: string;
        defaultValue?: string;
        placeholder?: string;
        readOnly?: boolean;
        onChange?: (content: string, delta: unknown, source: string, editor: unknown) => void;
        className?: string;
        style?: React.CSSProperties;
    }
    const ReactQuill: React.ComponentType<ReactQuillProps>;
    export default ReactQuill;
}
