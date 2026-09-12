import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleConfirmLogout = () => {
    setShowConfirmLogout(false);
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              +
            </div>
            <span className="font-bold text-xl text-slate-800">MedBook</span>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Hi, <strong className="text-slate-800">{user.name}</strong> (
                {user.role})
              </span>
              <Button
                variant="outline"
                onClick={() => setShowConfirmLogout(true)}
                className="text-sm py-1"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="grow max-w-7xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>

      <Modal
        isOpen={showConfirmLogout}
        onClose={() => setShowConfirmLogout(false)}
        title="Confirm Sign Out"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to sign out of your account?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmLogout(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmLogout}
            >
              Yes, Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
