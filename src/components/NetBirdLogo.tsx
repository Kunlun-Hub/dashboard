import { cn } from "@utils/helpers";
import Image from "next/image";
import * as React from "react";
import NetBirdLogoMark from "@/assets/netbird.svg";
import NetBirdLogoFull from "@/assets/netbird-full.svg";

type Props = {
  size?: "default" | "large";
  mobile?: boolean;
  customLogoSrc?: string;
  alt?: string;
};

const sizes = {
  default: {
    desktop: 22,
    mobile: 30,
  },
  large: {
    desktop: 24,
    mobile: 40,
  },
};

export const NetBirdLogo = ({
  size = "default",
  mobile = true,
  customLogoSrc,
  alt = "NetBird Logo",
}: Props) => {
  if (customLogoSrc) {
    return (
      <>
        <Image
          src={customLogoSrc}
          width={180}
          height={sizes[size].desktop}
          alt={alt}
          className={cn(
            "w-auto max-w-[180px] object-contain",
            mobile && "hidden md:block",
          )}
          style={{
            height: sizes[size].desktop,
          }}
          unoptimized
        />
        {mobile && (
          <Image
            src={customLogoSrc}
            width={sizes[size].mobile}
            height={sizes[size].mobile}
            alt={alt}
            className={"md:hidden ml-4 object-contain"}
            style={{
              width: sizes[size].mobile,
              height: sizes[size].mobile,
            }}
            unoptimized
          />
        )}
      </>
    );
  }

  return (
    <>
      <Image
        src={NetBirdLogoFull}
        height={sizes[size].desktop}
        alt={alt}
        className={cn(mobile && "hidden md:block")}
      />
      {mobile && (
        <Image
          src={NetBirdLogoMark}
          width={sizes[size].mobile}
          alt={alt}
          className={cn(mobile && "md:hidden ml-4")}
        />
      )}
    </>
  );
};
