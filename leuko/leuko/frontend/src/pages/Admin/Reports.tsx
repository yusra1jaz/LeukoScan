import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

const AdminReports: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent>
            <CardTitle>Weekly Patient Summary</CardTitle>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <CardTitle>Monthly Doctor Activity</CardTitle>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;
