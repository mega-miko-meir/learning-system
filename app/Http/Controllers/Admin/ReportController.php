<?php

namespace App\Http\Controllers\Admin;

use App\Exports\TrainingRegistryExport;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\TrainingAssignment;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index()
    {
        $summary = [
            'total_employees'     => User::active()->employees()->count(),
            'assignments_total'   => TrainingAssignment::count(),
            'assignments_done'    => TrainingAssignment::completed()->count(),
            'assignments_overdue' => TrainingAssignment::overdue()->count(),
        ];

        $byDepartment = Department::with(['users' => fn($q) => $q->employees()->active()])
            ->active()
            ->get()
            ->map(function ($dept) {
                $userIds   = $dept->users->pluck('id');
                $total     = TrainingAssignment::whereIn('user_id', $userIds)->count();
                $completed = TrainingAssignment::whereIn('user_id', $userIds)->completed()->count();

                return [
                    'id'        => $dept->id,
                    'name'      => $dept->name,
                    'employees' => $dept->users->count(),
                    'total'     => $total,
                    'completed' => $completed,
                    'percent'   => $total > 0 ? round($completed / $total * 100) : 0,
                ];
            })
            ->filter(fn($d) => $d['employees'] > 0)
            ->values();

        // Агрегированная статистика по каждому сотруднику — один запрос вместо N×3
        $stats = TrainingAssignment::selectRaw('
            user_id,
            COUNT(*) as total,
            SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status IN ("pending", "in_progress") AND due_date < NOW() THEN 1 ELSE 0 END) as overdue,
            SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed
        ')->groupBy('user_id')->get()->keyBy('user_id');

        $employees = User::active()->employees()
            ->with(['department', 'position'])
            ->orderBy('last_name')
            ->get()
            ->map(function ($emp) use ($stats) {
                $s         = $stats->get($emp->id);
                $total     = (int) ($s?->total ?? 0);
                $completed = (int) ($s?->completed ?? 0);
                $overdue   = (int) ($s?->overdue ?? 0);
                $failed    = (int) ($s?->failed ?? 0);

                return [
                    'id'         => $emp->id,
                    'full_name'  => $emp->full_name,
                    'department' => $emp->department?->name,
                    'position'   => $emp->position?->name,
                    'total'      => $total,
                    'completed'  => $completed,
                    'overdue'    => $overdue,
                    'failed'     => $failed,
                    'percent'    => $total > 0 ? round($completed / $total * 100) : 0,
                ];
            })
            ->values();

        return Inertia::render('Admin/Reports/Index', compact('summary', 'byDepartment', 'employees'));
    }

    public function employee(User $user)
    {
        return redirect()->route('admin.users.show', $user);
    }

    public function department(Department $department)
    {
        $employees = User::with('position')
            ->where('department_id', $department->id)
            ->active()
            ->get();

        $report = $employees->map(function ($emp) {
            $total     = TrainingAssignment::where('user_id', $emp->id)->count();
            $completed = TrainingAssignment::where('user_id', $emp->id)->completed()->count();
            $overdue   = TrainingAssignment::where('user_id', $emp->id)->overdue()->count();

            return [
                'id'        => $emp->id,
                'full_name' => $emp->full_name,
                'position'  => $emp->position?->name,
                'total'     => $total,
                'completed' => $completed,
                'overdue'   => $overdue,
                'percent'   => $total > 0 ? round($completed / $total * 100) : 0,
            ];
        });

        return Inertia::render('Admin/Reports/Department', [
            'department' => $department,
            'employees'  => $report,
        ]);
    }

    // ─── PDF-отчёт по сотруднику ─────────────────────────────
    public function employeePdf(User $user)
    {
        $user->load(['department', 'position', 'manager']);

        $assignments = TrainingAssignment::with(['document', 'testAttempts'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $total     = $assignments->count();
        $completed = $assignments->where('status', 'completed')->count();
        $pending   = $assignments->whereIn('status', ['pending', 'in_progress'])->count();
        $percent   = $total > 0 ? round($completed / $total * 100) : 0;

        $employee = $user; // алиас для шаблона

        $pdf = Pdf::loadView('reports.employee_pdf', compact(
            'employee', 'assignments', 'total', 'completed', 'pending', 'percent'
        ))->setPaper('a4', 'portrait');

        $filename = 'report_' . str_replace(' ', '_', $user->full_name) . '_' . now()->format('Ymd') . '.pdf';

        return $pdf->download($filename);
    }

    // ─── Excel-экспорт реестра ───────────────────────────────
    public function export(Request $request)
    {
        $export = new TrainingRegistryExport(
            departmentId: $request->integer('department_id') ?: null,
            status:       $request->input('status') ?: null,
            dateFrom:     $request->input('date_from') ?: null,
            dateTo:       $request->input('date_to') ?: null,
        );

        $filename = 'training_registry_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download($export, $filename);
    }
}
