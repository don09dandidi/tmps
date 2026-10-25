using System;

if (args.Length == 0)
{
    Console.WriteLine("Laboratory Work 1: Concurrency in Practice");
    Console.WriteLine("==========================================");
    Console.WriteLine("Usage: dotnet run -c Release -- <command> [options]");
    Console.WriteLine();
    Console.WriteLine("Commands:");
    Console.WriteLine("  gen              Generate numbers.txt (50,000,000 integers) and split into 8 files");
    Console.WriteLine("  split [folder]   Split existing numbers.txt into 8 files in [folder] (default: .)");
    Console.WriteLine("  1a [threads...]  Run Task 1a (default: 1 2 4 8 16 32 64)");
    Console.WriteLine("  1b               Run Task 1b (3 counting methods using logical processors)");
    Console.WriteLine("  1c [workers...]  Run Task 1c (producer/consumer, default: 1 2 4 8 16 32 64)");
    Console.WriteLine("  2 <folder> <t>   Run Task 2 using files in <folder> with <t> threads (1, 2, or 4)");
    return;
}

string cmd = args[0].ToLowerInvariant();
string[] taskArgs = args.Length > 1 ? args[1..] : Array.Empty<string>();

switch (cmd)
{
    case "gen" or "generate":
        NumbersGenerator.Run();
        break;

    case "split":
        string outDir = taskArgs.Length > 0 ? taskArgs[0] : ".";
        NumbersGenerator.Split("numbers.txt", outDir);
        break;

    case "1a" or "task1a":
        Task1a.Run(taskArgs);
        break;

    case "1b" or "task1b":
        Task1b.Run();
        break;

    case "1c" or "task1c":
        Task1c.Run(taskArgs);
        break;

    case "2" or "task2":
        Task2.Run(taskArgs);
        break;

    default:
        Console.WriteLine($"Unknown command: '{cmd}'");
        Console.WriteLine("Run without arguments to view available commands.");
        break;
}