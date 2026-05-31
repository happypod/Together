import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fontAwesomeIcons, type FontAwesomeIconName } from "@/lib/fa-icons";
import type { ComponentProps } from "react";

type FaIconProps = Omit<ComponentProps<typeof FontAwesomeIcon>, "icon"> & {
  name: FontAwesomeIconName;
};

export function FaIcon({ className, name, ...props }: FaIconProps) {
  const classes = ["fa-icon", className].filter(Boolean).join(" ");

  return (
    <FontAwesomeIcon
      aria-hidden="true"
      className={classes}
      focusable="false"
      icon={fontAwesomeIcons[name]}
      {...props}
    />
  );
}

export type { FontAwesomeIconName };
