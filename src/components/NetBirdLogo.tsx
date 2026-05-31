import { cn } from "@utils/helpers";
import Image from "next/image";
import * as React from "react";
import NetBirdLogoMark from "@/assets/netbird.svg";
import NetBirdLogoFull from "@/assets/netbird-full.svg";

type Props = {
  size?: "default" | "large";
  mobile?: boolean;
  customLogoSrc?: string;
  customDarkLogoSrc?: string;
  customIconSrc?: string;
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
  customDarkLogoSrc,
  customIconSrc,
  alt = "NetBird Logo",
}: Props) => {
  if (customLogoSrc || customDarkLogoSrc || customIconSrc) {
    const desktopLogo = customLogoSrc || customIconSrc;
    const desktopDarkLogo = customDarkLogoSrc || desktopLogo;
    const mobileLogo = customIconSrc || customLogoSrc;
    const mobileDarkLogo = customIconSrc || customDarkLogoSrc || customLogoSrc;
    const swapDesktopLogo =
      !!desktopDarkLogo && desktopDarkLogo !== desktopLogo;
    const swapMobileLogo = !!mobileDarkLogo && mobileDarkLogo !== mobileLogo;

    return (
      <>
        {desktopLogo ? (
          <BrandImage
            src={desktopLogo}
            width={180}
            height={sizes[size].desktop}
            alt={alt}
            className={cn(
              mobile && "hidden md:block",
              swapDesktopLogo && "dark:hidden",
            )}
          />
        ) : (
          <Image
            src={NetBirdLogoFull}
            height={sizes[size].desktop}
            alt={alt}
            className={cn(
              "max-w-[180px]",
              mobile && "hidden md:block",
              swapDesktopLogo && "dark:hidden",
            )}
          />
        )}
        {swapDesktopLogo && desktopDarkLogo && (
          <BrandImage
            src={desktopDarkLogo}
            width={180}
            height={sizes[size].desktop}
            alt={alt}
            className={cn("hidden", mobile ? "md:dark:block" : "dark:block")}
          />
        )}
        {mobile && (
          <>
            {mobileLogo ? (
              <BrandImage
                src={mobileLogo}
                width={sizes[size].mobile}
                height={sizes[size].mobile}
                alt={alt}
                className={cn(
                  "md:hidden ml-4",
                  swapMobileLogo && "dark:hidden",
                )}
                square
              />
            ) : (
              <Image
                src={NetBirdLogoMark}
                width={sizes[size].mobile}
                alt={alt}
                className={cn(
                  "md:hidden ml-4",
                  swapMobileLogo && "dark:hidden",
                )}
              />
            )}
            {swapMobileLogo && mobileDarkLogo && (
              <BrandImage
                src={mobileDarkLogo}
                width={sizes[size].mobile}
                height={sizes[size].mobile}
                alt={alt}
                className={"hidden dark:block md:dark:hidden ml-4"}
                square
              />
            )}
          </>
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

function BrandImage({
  src,
  width,
  height,
  alt,
  className,
  square = false,
}: Readonly<{
  src: string;
  width: number;
  height: number;
  alt: string;
  className?: string;
  square?: boolean;
}>) {
  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      className={cn("shrink-0 object-contain", className)}
      style={{
        width: square ? height : "auto",
        height,
        maxWidth: square ? height : "min(180px, 45vw)",
      }}
      unoptimized
    />
  );
}
