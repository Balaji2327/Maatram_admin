import React, { Suspense } from "react";
import PageLoader from "../../../components/PageLoader";
import AdminApplicationsScreen from "../../../pages/admin/AdminApplicationsScreen";

export const metadata = {
  title: "Applications Management | Maatram Foundation",
  description: "View, filter and manage all student applications.",
};

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AdminApplicationsScreen />
    </Suspense>
  );
}
