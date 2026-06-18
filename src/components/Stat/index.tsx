import { intComma } from '@/utils/utils';

interface IStatProperties {
  value: string | number;
  description: string;
  className?: string;
  citySize?: number;
  onClick?: () => void;
}

const Stat = ({
  value,
  description,
  className = 'w-full',
  citySize,
  onClick,
}: IStatProperties) => (
  <div className={`flex flex-col ${className}`} onClick={onClick}>
    <span
      className={`text-${citySize || 3}xl font-black tabular-nums tracking-tighter`}
    >
      {intComma(value.toString())}
    </span>
    <span className="mt-0.5 text-xs font-medium uppercase tracking-widest opacity-50">
      {description}
    </span>
  </div>
);

export default Stat;
