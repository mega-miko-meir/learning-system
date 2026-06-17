<?php

namespace App\Console\Commands;

use App\Models\Document;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanOrphanedDocuments extends Command
{
    protected $signature = 'documents:clean-orphans {--dry-run : Show what would be deleted without actually deleting}';
    protected $description = 'Delete files in storage/documents that have no record in the database';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $files = Storage::disk('public')->files('documents');

        if (empty($files)) {
            $this->info('No files found in storage/documents.');
            return self::SUCCESS;
        }

        $knownPaths = Document::pluck('file_path')->flip();

        $orphans = array_filter($files, fn($file) => !isset($knownPaths[$file]));

        if (empty($orphans)) {
            $this->info('No orphaned files found.');
            return self::SUCCESS;
        }

        $this->table(['File', 'Size', 'Status'], array_map(function ($file) use ($dryRun) {
            $size = round(Storage::disk('public')->size($file) / 1024, 1) . ' KB';

            if (!$dryRun) {
                Storage::disk('public')->delete($file);
            }

            return [$file, $size, $dryRun ? 'would be deleted' : 'deleted'];
        }, $orphans));

        $count = count($orphans);
        $msg   = $dryRun
            ? "Found {$count} orphaned file(s). Run without --dry-run to delete them."
            : "Deleted {$count} orphaned file(s).";

        $dryRun ? $this->warn($msg) : $this->info($msg);

        return self::SUCCESS;
    }
}
