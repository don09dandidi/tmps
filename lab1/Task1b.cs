using System.Diagnostics;

public static class Task1b
{
    private static class Counters
    {
        public static long Neg, Pos, Zero;
    }

    public static void Run()
    {
        const string path = "numbers.txt";
        if (!File.Exists(path))
        {
            Console.WriteLine($"Error: {path} not found. Generate it first using: dotnet run -c Release -- gen");
            return;
        }

        int threads = Environment.ProcessorCount;

        // Load all numbers into an integer array (not measured)
        Console.WriteLine($"Loading numbers from {path} into integer array (not measured)...");
        var swLoad = Stopwatch.StartNew();
        int[] data = LoadNumbers(path);
        swLoad.Stop();
        Console.WriteLine($"Loaded {data.Length:N0} numbers in {swLoad.Elapsed.TotalSeconds:F2} s; running with {threads} threads (logical processors)\n");

        // Version 1: shared counters, without synchronisation (run 3 times)
        for (int run = 1; run <= 3; run++)
        {
            Counters.Neg = Counters.Pos = Counters.Zero = 0;
            double t = RunThreads(threads, data, (id, from, to) =>
            {
                for (int i = from; i < to; i++)
                {
                    if (data[i] < 0) Counters.Neg++;
                    else if (data[i] > 0) Counters.Pos++;
                    else Counters.Zero++;
                }
            });
            Print($"1. No sync, run {run}", t, Counters.Neg, Counters.Pos, Counters.Zero);
        }

        // Version 2: shared counters protected by a lock or mutex
        Counters.Neg = Counters.Pos = Counters.Zero = 0;
        object gate = new object();
        double t2 = RunThreads(threads, data, (id, from, to) =>
        {
            for (int i = from; i < to; i++)
            {
                lock (gate)
                {
                    if (data[i] < 0) Counters.Neg++;
                    else if (data[i] > 0) Counters.Pos++;
                    else Counters.Zero++;
                }
            }
        });
        Print("2. Lock", t2, Counters.Neg, Counters.Pos, Counters.Zero);

        // Version 3: a separate counter for each thread, added together after all threads finish
        var neg = new long[threads];
        var pos = new long[threads];
        var zero = new long[threads];
        double t3 = RunThreads(threads, data, (id, from, to) =>
        {
            long n = 0, p = 0, z = 0;
            for (int i = from; i < to; i++)
            {
                if (data[i] < 0) n++;
                else if (data[i] > 0) p++;
                else z++;
            }
            neg[id] = n; pos[id] = p; zero[id] = z;
        });
        Print("3. Per-thread counters", t3, neg.Sum(), pos.Sum(), zero.Sum());
    }

    private static int[] LoadNumbers(string path)
    {
        var data = new int[50_000_000];
        int idx = 0;
        using var reader = new StreamReader(path);
        string? line;
        while ((line = reader.ReadLine()) != null && idx < data.Length)
        {
            data[idx++] = int.Parse(line);
        }
        if (idx < data.Length)
        {
            Array.Resize(ref data, idx);
        }
        return data;
    }

    private static double RunThreads(int threads, int[] data, Action<int, int, int> worker)
    {
        var list = new Thread[threads];
        var sw = Stopwatch.StartNew();
        for (int i = 0; i < threads; i++)
        {
            int id = i;
            int from = (int)((long)data.Length * id / threads);
            int to = (int)((long)data.Length * (id + 1) / threads);
            list[i] = new Thread(() => worker(id, from, to));
            list[i].Start();
        }
        foreach (var th in list) th.Join();
        return sw.Elapsed.TotalSeconds;
    }

    private static void Print(string name, double time, long n, long p, long z)
    {
        Console.WriteLine($"{name,-24} {time,8:F3} s   neg={n:N0}  pos={p:N0}  zero={z:N0}  total={n + p + z:N0}");
    }
}