using System.Collections.Concurrent;
using System.Diagnostics;

public static class Task1c
{
    const string Path = "numbers.txt";
    const int BatchSize = 10_000;
    const int QueueCapacity = 100;

    public static void Run(string[]? args = null)
    {
        if (!File.Exists(Path))
        {
            Console.WriteLine($"Error: {Path} not found. Generate it first using: dotnet run -c Release -- gen");
            return;
        }

        int[] workerCounts = args is { Length: > 0 }
            ? args.Select(int.Parse).ToArray()
            : new[] { 1, 2, 4, 8, 16, 32, 64 };

        Console.WriteLine($"{"Workers",7} {"Time (s)",9} {"Negative",13} {"Positive",13} {"Zero",11} {"Total",13} {"Peak mem (MB)",14}");

        long[]? reference = null;

        foreach (int w in workerCounts)
        {
            // Thread-safe queue that holds at most 100 batches.
            // Add() blocks when it is full; GetConsumingEnumerable() blocks when it is empty.
            var queue = new BlockingCollection<string[]>(QueueCapacity);

            var neg = new long[w];
            var pos = new long[w];
            var zero = new long[w];

            var sw = Stopwatch.StartNew();

            // Reader: one thread, reads line by line, sends batches of 10 000 lines
            var reader = new Thread(() =>
            {
                var batch = new string[BatchSize];
                int n = 0;
                foreach (var line in File.ReadLines(Path))
                {
                    batch[n++] = line;
                    if (n == BatchSize)
                    {
                        queue.Add(batch); // waits if the queue is full
                        batch = new string[BatchSize];
                        n = 0;
                    }
                }
                if (n > 0) // last, smaller batch
                {
                    Array.Resize(ref batch, n);
                    queue.Add(batch);
                }
                queue.CompleteAdding(); // close the queue: no more batches
            });

            // Workers: take batches until the queue is closed AND empty
            var workers = new Thread[w];
            for (int i = 0; i < w; i++)
            {
                int id = i;
                workers[i] = new Thread(() =>
                {
                    long n = 0, p = 0, z = 0; // local counters, no sharing
                    foreach (var batch in queue.GetConsumingEnumerable()) // waits if empty
                    {
                        foreach (var line in batch)
                        {
                            int x = int.Parse(line);
                            if (x < 0) n++;
                            else if (x > 0) p++;
                            else z++;
                        }
                    }
                    neg[id] = n; pos[id] = p; zero[id] = z;
                });
                workers[i].Start();
            }
            reader.Start();

            reader.Join();
            foreach (var t in workers) t.Join();
            sw.Stop();

            long N = neg.Sum(), P = pos.Sum(), Z = zero.Sum();
            double peakMb = PeakMem.Mb();
            Console.WriteLine($"{w,7} {sw.Elapsed.TotalSeconds,9:F3} {N,13:N0} {P,13:N0} {Z,11:N0} {N + P + Z,13:N0} {peakMb,14:F1}");

            reference ??= new[] { N, P, Z };
            if (reference[0] != N || reference[1] != P || reference[2] != Z)
                Console.WriteLine("  !! counts differ from the first run");
        }
    }
}