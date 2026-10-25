using System.Diagnostics;

public static class Task2
{
    public static void Run(string[] args)
    {
        if (args.Length < 2)
        {
            Console.WriteLine("Usage: dotnet run -c Release -- 2 <folder> <threads>");
            Console.WriteLine("  <folder>   Folder containing numbers_1.txt ... numbers_8.txt (e.g., '.' or USB mount path)");
            Console.WriteLine("  <threads>  Number of threads: 1, 2, or 4");
            return;
        }

        string folder = args[0];
        if (!int.TryParse(args[1], out int t) || t <= 0)
        {
            Console.WriteLine("Error: threads must be a positive integer (e.g. 1, 2, or 4).");
            return;
        }

        const int Files = 8;

        // Verify files exist
        for (int f = 1; f <= Files; f++)
        {
            string p = System.IO.Path.Combine(folder, $"numbers_{f}.txt");
            if (!File.Exists(p))
            {
                Console.WriteLine($"Error: {p} not found! Run 'dotnet run -c Release -- split [folder]' first.");
                return;
            }
        }

        var neg = new long[t];
        var pos = new long[t];
        var zero = new long[t];
        var readTime = new double[t];  // seconds each thread spent reading from the drive
        var parseTime = new double[t]; // seconds each thread spent parsing and counting

        var threads = new Thread[t];
        var total = Stopwatch.StartNew();

        for (int i = 0; i < t; i++)
        {
            int id = i;
            // Files divided as evenly as possible: thread id gets files [from, to)
            int from = Files * id / t;
            int to = Files * (id + 1) / t;

            threads[i] = new Thread(() =>
            {
                long n = 0, p = 0, z = 0;
                double rt = 0, pt = 0;

                for (int f = from; f < to; f++)
                {
                    string path = System.IO.Path.Combine(folder, $"numbers_{f + 1}.txt");

                    var sw = Stopwatch.StartNew();
                    byte[] buf = File.ReadAllBytes(path); // whole file in one operation
                    rt += sw.Elapsed.TotalSeconds;

                    sw.Restart();
                    bool negative = false, has = false;
                    int value = 0;
                    foreach (byte c in buf)
                    {
                        if (c == (byte)'\n')
                        {
                            if (has) { if (value == 0) z++; else if (negative) n++; else p++; }
                            negative = false; has = false; value = 0;
                        }
                        else if (c == (byte)'-') negative = true;
                        else if (c >= (byte)'0' && c <= (byte)'9') { value = value * 10 + (c - '0'); has = true; }
                    }
                    if (has) { if (value == 0) z++; else if (negative) n++; else p++; } // no trailing newline
                    pt += sw.Elapsed.TotalSeconds;
                }

                neg[id] = n; pos[id] = p; zero[id] = z;
                readTime[id] = rt; parseTime[id] = pt;
            });
            threads[i].Start();
        }
        foreach (var th in threads) th.Join();
        total.Stop();

        long N = neg.Sum(), P = pos.Sum(), Z = zero.Sum();
        double peakMb = Process.GetCurrentProcess().PeakWorkingSet64 / (1024.0 * 1024.0);

        Console.WriteLine($"Threads:        {t}");
        Console.WriteLine($"Total time:     {total.Elapsed.TotalSeconds:F3} s");
        Console.WriteLine($"Peak memory:    {peakMb:F1} MB");
        Console.WriteLine($"Negative: {N:N0}   Positive: {P:N0}   Zero: {Z:N0}   Total: {N + P + Z:N0}");
        Console.WriteLine();
        Console.WriteLine("Per thread (seconds):  read from drive | parse + count");
        for (int i = 0; i < t; i++)
            Console.WriteLine($"  thread {i}: {readTime[i],8:F3} | {parseTime[i],8:F3}");
    }
}