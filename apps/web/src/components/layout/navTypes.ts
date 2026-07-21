import type { ComponentType } from 'react';
import type { IconProps } from '../ui/icons';

export interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<IconProps>;
  end?: boolean;
}
