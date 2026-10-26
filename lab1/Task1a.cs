using System.Diagnostics;

public static class Task1a
{
    const string Path = "numbers.txt";

    public static void Run(string[]? args = null)
    {
        int[] threadCounts = args is { Length: > 0 }
            ? args.Select(int.Parse).ToArray()
            : new[] { 1, 2, 4, 8, 16, 32, 64 };

        if (!File.Exists(Path))
        {
            Console.WriteLine($"Error: {Path} not found. Generate it first using: dotnet run -c Release -- gen");
            return;
        }

        long fileLength = new FileInfo(Path).Length;

        Console.WriteLine($"{"Threads",7} {"Time(s)",9} {"Negative",13} {"Positive",13} {"Zero",10} {"Total",12} {"PeakMB",8}");

        foreach (int t in threadCounts)
        {
            var results = new (long neg, long pos, long zero)[t];
            var threads = new Thread[t];

            var sw = Stopwatch.StartNew();
            for (int i = 0; i < t; i++)
            {
                int id = i;
                long start = fileLength * id / t;
                long end = fileLength * (id + 1) / t;

                threads[i] = new Thread(() => results[id] = CountRange(start, end));
                threads[i].Start();
            }
            foreach (var th in threads) th.Join();
            sw.Stop();

            long neg = results.Sum(r => r.neg);
            long pos = results.Sum(r => r.pos);
            long zero = results.Sum(r => r.zero);
            double peakMb = PeakMem.Mb();

            Console.WriteLine($"{t,7} {sw.Elapsed.TotalSeconds,9:F3} {neg,13:N0} {pos,13:N0} {zero,10:N0} {neg + pos + zero,12:N0} {peakMb,8:F1}");
        }
    }

    private static (long neg, long pos, long zero) CountRange(long start, long end)
    {
        long neg = 0, pos = 0, zero = 0;

        using var fs = new FileStream(Path, FileMode.Open, FileAccess.Read, FileShare.Read);
        using var reader = new BufferedStream(fs, 1 << 20);

        long offset = start;

        if (start > 0)
        {
            offset = start - 1;
            reader.Seek(offset, SeekOrigin.Begin);
            int skip;
            while ((skip = reader.ReadByte()) != -1)
            {
                offset++;
                if (skip == '\n') break;
            }
        }

        while (offset < end)
        {
            bool negative = false, hasDigits = false;
            int value = 0;
            int b;

            while ((b = reader.ReadByte()) != -1)
            {
                offset++;
                if (b == '\n') break;
                if (b == '-') negative = true;
                else if (b >= '0' && b <= '9') { value = value * 10 + (b - '0'); hasDigits = true; }
            }

            if (!hasDigits)
            {
                if (b == -1) break;
                continue;
            }

            if (value == 0) zero++;
            else if (negative) neg++;
            else pos++;
        }

        return (neg, pos, zero);
    }
}