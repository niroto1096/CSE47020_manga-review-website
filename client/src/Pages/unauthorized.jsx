import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button"; // using shadcn/ui

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <h1 className="text-3xl font-bold text-red-500 mb-2">Unauthorized</h1>
      <p className="text-gray-600 mb-6">You do not have permission to view this page.</p>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );
};

export default Unauthorized;