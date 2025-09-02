export interface User {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  role_id?: string
  project_id?: string
  is_active?: boolean
  last_login?: string
  created_at?: string
  updated_at?: string
  profile?: string
  status?: string
  roles?: {
    name: string
  }
  projects?: {
    name: string
  }
} 

export enum UserRoles {
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user"
}

export interface Knowledgebase {
  id: string
  created_at?: string
  title?: string
}

export const enum ActorType {
  USER = "USER",
  AGENT = "AGENT",
  CHATBOT = "CHATBOT",
  SYSTEM = "SYSTEM",
  SELF = "SELF",
}

export interface Channel {
  id: string
  created_at?: string
  title?: string
  whatsapp_number?: string
  instance_id?: string
  connection_status?: boolean
  token?: string
  status_checked_at?: string
  source?: string
  active?: boolean
  avatar?: string
}

export interface Chatbot {
  id: string
  created_at?: string
  title?: string
  active?: boolean
  avater?: string
}

export interface Contact {
  id: string
  name: string
  contact_number: string
  avatar?: string
  created_at?: string
  linkedUsers?: User[]
  source?: string
}

export interface UserContact {
  id: string
  contact_id: string
  user_id: string
  created_at?: string
  updated_at?: string
  contact?: Contact
  user?: User
}

export interface ConversationSchema {
  id?: string;
  title?: string;
  agent_id?: string;
  contact_id?: string | null;
  chatbot_id?: string | null;
  controlled_by?: string | null;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string;
  active?: boolean;
  channel_id?: string | null;
  unread_messages?: number;
  source?: string;
  tags?: any;
  notes?: any;
  organization_user_id?: string | null;
  messages?: Message[];
  contact?: any;
  channel?: any;
  chatbot?: any;
  contactsCollection?: Contact;
  channelsCollection?: Channel;
  chatbotsCollection?: Chatbot;
}

export interface Message {
  id: string;
  message_id: string;
  conversation_id: string;
  contact_id?: string | null;
  actor_type: ActorType;
  content: any;
  created_at?: string;
  updated_at?: string;
  agent_id?: string | null;
  chatbot_id?: string | null;
  agent?: User;
  chabotCollection?: Chatbot;
  contactCollection?: Contact;
}

export interface Property {
  id?: string | undefined;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  description: string;
  features: {
    name: string;
    icon: string;
  }[];
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  amenities: {
    name: string;
    icon: string;
  }[];
  agent: {
    name: string;
    phone: string;
    email: string;
    photo: string;
  };
  financials: {
    taxes: number;
    hoaFees: number;
    utilities: number;
  };
  images: {
    url: string | File;
    alt: string;
  }[];
  floor_plan: {
    url: string | File;
    alt: string;
  };
  pdf_url?: string;
  qrcode_url?: string;
}

export type TemplateStyle = "modern" | "classic" | "minimal";

export type FactsheetType = "company" | "product" | "technical" | "executive";

export interface FactsheetTemplate {
  id: string;
  name: string;
  style: TemplateStyle;
  type: FactsheetType;
  description: string;
  preview: string;
  orientation: "portrait" | "landscape";
}
