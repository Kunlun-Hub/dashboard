export type IconProps = {
  size?: 16 | 32 | 44 | 128 | 256 | 512 | number;
  className?: string;
  autoHeight?: boolean;
};

export const defaultIconProps: IconProps = {
  size: 15,
  className:
    "fill-gray-500 dark:fill-nb-gray-400 peer-data-[active=true]/icon:fill-netbird-700 peer-data-[active=true]/icon:dark:fill-netbird-150 shrink-0",
  autoHeight: false,
};

export const iconProperties = (props: IconProps) => {
  return {
    className: props.className ? props.className : defaultIconProps.className,
    style: {
      width: props.size ? `${props.size}px` : `${defaultIconProps.size}px`,
      height: props.autoHeight
        ? "auto"
        : props.size
        ? `${props.size}px`
        : `${defaultIconProps.size}px`,
    },
  };
};
