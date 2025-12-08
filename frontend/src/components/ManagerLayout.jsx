import ManagerNavbar from './ManagerNavbar';

export default function ManagerLayout({ children }) {
    return (
        <>
            <ManagerNavbar />
            <div className="main-content">
                {children}
            </div>
        </>
    );
}