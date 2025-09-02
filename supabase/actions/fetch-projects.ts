"use server";

export interface Project {
  id: string;
  Name: string;
  Active: boolean;
  Exclusive: boolean;
  Current_State?: string;
  Developer?: {
    name: string;
    id: string;
  } | null;
  Start_Date?: string | null;
  Completion_Date?: string | null;
  Enable_Reminders?: boolean;
  Record_Image?: string | null;
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const response = await fetch(
      "https://n8n.browserautomations.com/webhook/67a42846-a359-4ff0-9d47-7f50e63ed14c",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data: Project[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
} 