import { cn } from "@/utils/classnameUtils";

export const panelShellClassName =
  'flex h-full flex-col gap-4 overflow-x-hidden overflow-y-auto border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]';

export const panelSectionClassName = 'rounded-xl border border-slate-200 bg-slate-50 p-4';

export const panelSecionTitleClassName = 'text-sm text-slate-400'

export const inputClassBarebone = 'rounded-md border border-white bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-200 focus:border-slate-200'

export const inputClassName =
  cn(inputClassBarebone, 'rounded-md border border-slate-200 focus:border-sky-400');
  
const buttonClassBarebone = 'rounded-md border border-white text-sm text-slate-600 font-medium px-3 py-2 break-none whitespace-nowrap cursor-pointer transition'

export const buttonClassName =
  cn(buttonClassBarebone, 'border-slate-200 bg-white hover:border-sky-300 hover:text-sky-700');

export const primaryButtonClassName =
  cn(buttonClassBarebone, 'bg-sky-400 px-4 font-semibold text-white hover:bg-sky-300 disabled:cursor-not-allowed disabled:bg-slate-300');

export const iconButtonClassName =
  cn(buttonClassBarebone, 'flex h-10 w-10 items-center justify-center border-slate-200 hover:border-sky-300 hover:text-sky-700');

export const toolbarButtonClassName =
  cn(buttonClassBarebone, 'mx-1 py-1.5');

export const contextMenuClassName = cn(buttonClassName, 'text-left border-white hover:border-white hover:bg-slate-100 hover:text-slate-600')
