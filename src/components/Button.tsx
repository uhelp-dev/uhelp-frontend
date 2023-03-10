import className from "classnames";
import Link from "next/link";

type ButtonProps = {
  xl?: boolean;
  sm?: boolean;
  secondary?: boolean;
  label: string;
  href?: string;
  Icon?: React.FunctionComponent<any>;
};

const Button = ({ Icon, label, href, xl, sm, secondary }: ButtonProps) => {
  const btnClass = className({
    btn: true,
    "btn-xl": xl,
    "btn-sm": sm,
    "btn-primary": !secondary,
    "btn-secondary": secondary,
    "btn-base": !xl && !sm,
  });

  return (
    <div className={btnClass}>
      <>
        {Icon && <Icon />}
        {href ? <Link href={"/signup"}>{label}</Link> : <span>{label}</span>}
      </>
    </div>
  );
};

export { Button };
