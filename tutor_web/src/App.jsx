import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { CatalogPage } from "./pages/CatalogPage";
import { TutorDetailsPage } from "./pages/TutorDetailsPage";
import { MyLessonsPage } from "./pages/MyLessonsPage.jsx";
import { MyReviewsPage } from "./pages/MyReviewsPage";
import { SurveysPage } from "./pages/SurveysPage";
import { TutorDashboard } from "./pages/TutorDashboard";
import { SchedulePage } from "./pages/SchedulePage";
import { RequestsPage } from "./pages/RequestsPage";
import { MyStudentsPage } from "./pages/MyStudentsPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ManageUsersPage } from "./pages/ManageUsersPage";
import { ManageSubjectsPage } from "./pages/ManageSubjectsPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [userRole, setUserRole] = useState("guest");
  const [selectedTutorId, setSelectedTutorId] = useState(null);

  const handleLogin = (role) => {
    setUserRole(role);
    if (role === "student") {
      setCurrentPage("dashboard");
    } else if (role === "tutor") {
      setCurrentPage("tutor-dashboard");
    } else if (role === "admin") {
      setCurrentPage("admin-dashboard");
    }
  };

  const handleLogout = () => {
    setUserRole("guest");
    setCurrentPage("home");
  };

  const handleNavigate = (page) => {
    if (page === "login") {
      setCurrentPage("login");
    } else if (page === "home") {
      setCurrentPage("home");
    } else if (page === "catalog") {
      setCurrentPage("catalog");
    } else if (page === "dashboard") {
      setCurrentPage("dashboard");
    } else if (page === "my-lessons") {
      setCurrentPage("my-lessons");
    } else if (page === "my-reviews") {
      setCurrentPage("my-reviews");
    } else if (page === "surveys") {
      setCurrentPage("surveys");
    } else if (page === "tutor-dashboard") {
      setCurrentPage("tutor-dashboard");
    } else if (page === "schedule") {
      setCurrentPage("schedule");
    } else if (page === "requests") {
      setCurrentPage("requests");
    } else if (page === "my-students") {
      setCurrentPage("my-students");
    } else if (page === "admin-dashboard") {
      setCurrentPage("admin-dashboard");
    } else if (page === "manage-users") {
      setCurrentPage("manage-users");
    } else if (page === "manage-subjects") {
      setCurrentPage("manage-subjects");
    }
  };

  const handleViewTutorDetails = (tutorId) => {
    setSelectedTutorId(tutorId);
    setCurrentPage("tutor-details");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            onNavigate={handleNavigate}
            onViewTutorDetails={handleViewTutorDetails}
          />
        );
      case "login":
        return (
          <LoginPage
            onLogin={handleLogin}
            onNavigate={handleNavigate}
          />
        );
      case "catalog":
        return (
          <CatalogPage
            onViewTutorDetails={handleViewTutorDetails}
          />
        );
      case "tutor-details":
        return (
          <TutorDetailsPage
            tutorId={selectedTutorId || "1"}
            onNavigate={handleNavigate}
          />
        );
      case "dashboard":
        return (
          <StudentDashboard
            onViewTutorDetails={handleViewTutorDetails}
          />
        );
      case "my-lessons":
        return <MyLessonsPage />;
      case "my-reviews":
        return <MyReviewsPage />;
      case "surveys":
        return <SurveysPage />;
      case "tutor-dashboard":
        return <TutorDashboard />;
      case "schedule":
        return <SchedulePage />;
      case "requests":
        return <RequestsPage />;
      case "my-students":
        return <MyStudentsPage />;
      case "admin-dashboard":
        return <AdminDashboard />;
      case "manage-users":
        return <ManageUsersPage />;
      case "manage-subjects":
        return <ManageSubjectsPage />;
      default:
        return (
          <HomePage
            onNavigate={handleNavigate}
            onViewTutorDetails={handleViewTutorDetails}
          />
        );
    }
  };

  // Guest pages without sidebar
  if (currentPage === "home" || currentPage === "login") {
    return (
      <div className="min-h-screen">
        {currentPage === "home" && (
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-primary-200">
            <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-300 to-secondary-300 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🐾</span>
                </div>
                <h2 className="text-primary-600">TutorPaw</h2>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleNavigate("catalog")}
                  className="px-4 py-2 text-neutral-700 hover:text-primary-600 transition-colors"
                >
                  Каталог
                </button>
                <button
                  onClick={() => handleNavigate("login")}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-lg transition-all"
                >
                  Войти
                </button>
              </div>
            </div>
          </header>
        )}
        <main className="max-w-7xl mx-auto px-8 py-8">
          {renderPage()}
        </main>
      </div>
    );
  }

  // Authorized pages with sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar
        userRole={userRole}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-8">{renderPage()}</main>
    </div>
  );
}