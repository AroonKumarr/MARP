"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { KanbanBoard, BoardItem } from "@/components/dashboard/KanbanBoard";
import { AnalyticsDonut } from "@/components/dashboard/AnalyticsDonut";
import { WeeklyBarChart } from "@/components/dashboard/WeeklyBarChart";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

export default function DashboardPage() {
  const [boardData, setBoardData] = useState<{
    todo: BoardItem[];
    in_progress: BoardItem[];
    review: BoardItem[];
  }>({ todo: [], in_progress: [], review: [] });

  const [donutData, setDonutData] = useState<{
    total: number;
    items: { name: string; value: number; color: string }[];
  }>({ total: 0, items: [] });

  const [weeklyData, setWeeklyData] = useState<{
    total_count: number;
    headline_metric: string;
    subtext: string;
    days: { day: string; count: number; date_str: string; is_active: boolean }[];
  }>({
    total_count: 0,
    headline_metric: "0 Tasks",
    subtext: "Submissions this week",
    days: [],
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMeFiltered, setIsMeFiltered] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BoardItem | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [board, donut, weekly] = await Promise.all([
          apiFetch<any>("/dashboard/workflow-board"),
          apiFetch<any>("/dashboard/analytics/donut"),
          apiFetch<any>("/dashboard/analytics/weekly"),
        ]);
        setBoardData(board);
        setDonutData(donut);
        setWeeklyData(weekly);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Filter tasks by search term
  const filterList = (items: BoardItem[]) => {
    if (!searchTerm) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredTodo = filterList(boardData.todo);
  const filteredInProgress = filterList(boardData.in_progress);
  const filteredReview = filterList(boardData.review);

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <Header
        onSearch={(term) => setSearchTerm(term)}
        onToggleMe={() => setIsMeFiltered(!isMeFiltered)}
        isMeFiltered={isMeFiltered}
        actionLabel="New Campaign"
        onAction={() => (window.location.href = "/campaigns")}
      />

      {/* Main Grid: Left Kanban Board (2 cols), Right Analytics Cards (1 col) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start pb-6">
        {/* Left Column: Research Workflow Board (To Do, In Progress, Review) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <KanbanBoard
            todo={filteredTodo}
            inProgress={filteredInProgress}
            review={filteredReview}
            onCardClick={(task) => setSelectedTask(task)}
          />
        </div>

        {/* Right Column: Dark Donut Widget + Frosted Weekly Chart */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Black Donut Card */}
          <AnalyticsDonut
            title="Questionnaire Categories"
            total={donutData.total}
            items={donutData.items}
          />

          {/* Frosted Weekly Bar Chart Card */}
          <WeeklyBarChart
            headline={weeklyData.headline_metric}
            subtext={weeklyData.subtext}
            days={weeklyData.days}
          />
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          description={`Category: ${selectedTask.category} • Status: ${selectedTask.status}`}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#77746F] uppercase">
                Task Description
              </label>
              <p className="text-sm text-[#171717] mt-1 p-3 bg-white rounded-xl border border-[#ECE8E0]">
                {selectedTask.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#77746F] uppercase">
                  Due Date
                </label>
                <p className="text-sm font-medium text-[#171717] mt-1">
                  {selectedTask.due_date_formatted}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#77746F] uppercase">
                  Assigned Personnel
                </label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedTask.assignees.map((a, i) => (
                    <span key={i} className="text-sm font-medium text-[#171717]">
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#ECE8E0]">
              <Button onClick={() => setSelectedTask(null)} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
