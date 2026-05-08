import React from "react";

interface HelmetProps {
    title: string;
    children: React.ReactNode;
}

const Helmet: React.FC<HelmetProps> = (props) => {
    document.title = 'MedBot - ' + props.title;
    return <div className="w-100">{props.children}</div>;
};

export default Helmet;