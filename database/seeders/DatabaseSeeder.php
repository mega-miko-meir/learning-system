<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Position;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Отделы ──────────────────────────────────────────
        $deptQA  = Department::create(['name' => 'Отдел обеспечения качества']);
        $deptHR  = Department::create(['name' => 'Отдел кадров']);
        $deptProd = Department::create(['name' => 'Производственный отдел']);
        $deptIT  = Department::create(['name' => 'IT отдел']);

        // ─── Должности ───────────────────────────────────────
        $posQASpec    = Position::create(['name' => 'Специалист по качеству', 'department_id' => $deptQA->id]);
        $posQALead    = Position::create(['name' => 'Руководитель отдела качества', 'department_id' => $deptQA->id]);
        $posHRSpec    = Position::create(['name' => 'HR специалист', 'department_id' => $deptHR->id]);
        $posProdOper  = Position::create(['name' => 'Оператор производства', 'department_id' => $deptProd->id]);
        $posProdLead  = Position::create(['name' => 'Начальник производства', 'department_id' => $deptProd->id]);
        $posITDev     = Position::create(['name' => 'Разработчик', 'department_id' => $deptIT->id]);

        // ─── Администраторы ───────────────────────────────────
        $admin = User::create([
            'last_name'  => 'Иванов',
            'first_name' => 'Алексей',
            'middle_name' => 'Сергеевич',
            'role'       => 'admin',
            'email'      => 'admin@company.com',
            'password'   => Hash::make('Admin123!'),
            'department_id' => $deptQA->id,
            'position_id'   => $posQASpec->id,
            'is_active'     => true,
            'hired_at'      => '2020-01-15',
            'must_change_password' => false,
        ]);

        $hrAdmin = User::create([
            'last_name'  => 'Петрова',
            'first_name' => 'Марина',
            'middle_name' => 'Викторовна',
            'role'       => 'hr_admin',
            'email'      => 'hr@company.com',
            'password'   => Hash::make('Hr123456!'),
            'department_id' => $deptHR->id,
            'position_id'   => $posHRSpec->id,
            'is_active'     => true,
            'hired_at'      => '2021-03-01',
            'must_change_password' => false,
        ]);

        // ─── Руководители ─────────────────────────────────────
        $managerProd = User::create([
            'last_name'  => 'Сидоров',
            'first_name' => 'Дмитрий',
            'middle_name' => 'Александрович',
            'role'       => 'manager',
            'email'      => 'manager.prod@company.com',
            'password'   => Hash::make('Manager123!'),
            'department_id' => $deptProd->id,
            'position_id'   => $posProdLead->id,
            'is_active'     => true,
            'hired_at'      => '2019-06-10',
            'must_change_password' => false,
        ]);

        $managerQA = User::create([
            'last_name'  => 'Козлова',
            'first_name' => 'Елена',
            'middle_name' => 'Николаевна',
            'role'       => 'manager',
            'email'      => 'manager.qa@company.com',
            'password'   => Hash::make('Manager123!'),
            'department_id' => $deptQA->id,
            'position_id'   => $posQALead->id,
            'is_active'     => true,
            'hired_at'      => '2018-11-20',
            'must_change_password' => false,
        ]);

        // Обновляем department.manager_id
        $deptProd->update(['manager_id' => $managerProd->id]);
        $deptQA->update(['manager_id' => $managerQA->id]);

        // ─── Сотрудники ───────────────────────────────────────
        $employees = [
            [
                'last_name' => 'Артёмов', 'first_name' => 'Иван', 'middle_name' => 'Петрович',
                'phone' => '+77011234567', 'department_id' => $deptProd->id,
                'position_id' => $posProdOper->id, 'manager_id' => $managerProd->id,
                'hired_at' => '2022-03-15',
            ],
            [
                'last_name' => 'Белова', 'first_name' => 'Анна', 'middle_name' => 'Игоревна',
                'phone' => '+77017654321', 'department_id' => $deptProd->id,
                'position_id' => $posProdOper->id, 'manager_id' => $managerProd->id,
                'hired_at' => '2022-07-01',
            ],
            [
                'last_name' => 'Громов', 'first_name' => 'Сергей', 'middle_name' => 'Олегович',
                'phone' => '+77019876543', 'department_id' => $deptQA->id,
                'position_id' => $posQASpec->id, 'manager_id' => $managerQA->id,
                'hired_at' => '2023-01-10',
            ],
        ];

        foreach ($employees as $data) {
            User::create(array_merge($data, [
                'role'     => 'employee',
                'password' => Hash::make('Temp1234!'),
                'is_active' => true,
                'must_change_password' => true,
            ]));
        }

        $this->command->info('✓ Seeder выполнен успешно!');
        $this->command->table(
            ['Роль', 'Логин', 'Пароль'],
            [
                ['admin',    'admin@company.com',        'Admin123!'],
                ['hr_admin', 'hr@company.com',           'Hr123456!'],
                ['manager',  'manager.prod@company.com', 'Manager123!'],
                ['manager',  'manager.qa@company.com',   'Manager123!'],
                ['employee', '+77011234567',              'Temp1234!'],
                ['employee', '+77017654321',              'Temp1234!'],
                ['employee', '+77019876543',              'Temp1234!'],
            ]
        );
    }
}
