import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

interface BreadcrumbItem {
    label: string;
    href?: string; // Optional href for links, if not provided it's considered the current page
}

interface PageHeaderProps {
    title: string;
    breadcrumbs: BreadcrumbItem[];
    showBackButton?: boolean;
    onBack?: () => void;
    actions?: React.ReactNode; // For buttons, etc.
}

const PageHeader = (props: PageHeaderProps) => {
    const { title,
        breadcrumbs,
        showBackButton = true,
        onBack,
        actions,
    } = props;

    return (
        <div className="flex justify-between items-center gap-2 w-full">
            <div className="flex gap-2 items-start">
                {showBackButton && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <div className="flex flex-col gap-1">
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((item, index) => (
                                <React.Fragment key={item.label}>
                                    <BreadcrumbItem>
                                        {item.href ? (
                                            <BreadcrumbLink>
                                                <Link to={item.href}>{item.label}</Link>
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                    <h2 className="font-bold text-xl">{title}</h2>
                </div>
            </div>
            <div className="flex gap-2">{actions}</div>
        </div>
    );
};

export default PageHeader;
