import Image from 'next/image';

export default function Logo({ size = 'medium', className = '' }: { size?: 'small' | 'medium' | 'large', className?: string }) {
    const sizes = {
        small: 32,
        medium: 48,
        large: 80
    }

    const textSizes = {
        small: 'text-lg',
        medium: 'text-2xl',
        large: 'text-5xl'
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className="relative">
                <Image
                    src="/logo_user.jpg"
                    alt="Logo"
                    width={sizes[size]}
                    height={sizes[size]}
                    className="object-contain rounded-xl hover:scale-105 transition-transform duration-300"
                    priority
                />
            </div>

            {size !== 'small' && (
                <div className="flex flex-col justify-center">
                    <h1 className={`font-black tracking-tighter text-slate-900 leading-none ${textSizes[size]}`}>
                        FRESH<span className="text-emerald-600">RIDER</span>
                    </h1>
                    <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5 ml-0.5">
                        Hygiene Systems
                    </span>
                </div>
            )}
        </div>
    )
}
