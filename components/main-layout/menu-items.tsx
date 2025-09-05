import { UserRoles } from "@/types/types";
import {
  RiScanLine,
  RiMessage2Line,
  RiSettings3Line,
  RiTeamLine,
} from "@remixicon/react";

export const getNavData = (user: { roles?: string }) => {
  const navMain = [
    {
      title: "Sections",
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: RiScanLine,
          isActive: false,
        },
      ],
    },
  ];

  // Navigation for managers - includes settings but not admin area
  const managerNavMain = [
    ...navMain,
    {
      title: "Other",
      url: "#",
      items: [
        {
          title: "Settings",
          url: "/settings",
          icon: RiSettings3Line,
        },
      ],
    },
  ];

  // Navigation for admins - includes settings and admin area
  const adminNavMain = [
    ...managerNavMain,
    {
      title: "Admin Area",
      url: "#",
      items: [
        {
          title: "Users",
          url: "/users",
          icon: RiTeamLine,
          isActive: false,
          resource: "users",
        },
      ],
    },
  ];

  const isAdmin =
    user.roles === UserRoles.ADMIN || user.roles?.includes(UserRoles.ADMIN);
  const isManager =
    user.roles === UserRoles.MANAGER || user.roles?.includes(UserRoles.MANAGER);

  return {
    navMain: isAdmin ? adminNavMain : isManager ? managerNavMain : navMain,
  };
};
