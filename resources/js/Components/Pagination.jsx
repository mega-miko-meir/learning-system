import { Link } from "@inertiajs/react";

export default function Pagination({ links }) {
    if (!links || links.length <= 3) return null;
    return (
        <div className="flex gap-1 mt-6 justify-center flex-wrap">
            {links.map((link, i) => (
                <Link
                    key={i}
                    href={link.url ?? "#"}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                    className={`px-3 py-1.5 rounded-lg text-sm border min-w-[36px] text-center ${
                        link.active
                            ? "bg-blue-600 text-white border-blue-600"
                            : link.url
                            ? "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                            : "bg-white text-gray-300 border-gray-100 cursor-default pointer-events-none"
                    }`}
                />
            ))}
        </div>
    );
}
