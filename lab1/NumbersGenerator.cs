using System.Diagnostics;
using System.Text;
using System.IO;


public static class NumbersGenerator
{
    const int Count = 50_000_000;
    const int Parts = 8;
    const int LinesPerPart = Count / Parts;  

    public static void Run()
    {
        const int min = -1_000_000;
        const int max = 1_000_000;
        const string filePath = "numbers.txt";

        var stopwatch = Stopwatch.StartNew();
        var rng = new Random();

        long negative = 0, positive = 0, zero = 0;

        using (var writer = new StreamWriter(filePath, false, new UTF8Encoding(false), 1 << 20))
        {
            writer.NewLine = "\n";
            for (int i = 0; i < Count; i++)
            {
                int n = rng.Next(min, max + 1);
                if (n < 0) negative++;
                else if (n > 0) positive++;
                else zero++;
                writer.Write(n);
                writer.Write('\n');
            }
        }

        Console.WriteLine($"Generated {Count:N0} numbers in {stopwatch.Elapsed.TotalSeconds:F1}s -> {filePath}");
        Console.WriteLine($"Negative: {negative:N0}");
        Console.WriteLine($"Positive: {positive:N0}");
        Console.WriteLine($"Zero:     {zero:N0}");
        Console.WriteLine($"Sum:      {negative + positive + zero:N0} (must equal {Count:N0})");

        // Task 2: split numbers.txt, in order, into 8 files
        Split(filePath, ".");
    }

    // Splits the file, in order, into numbers_1.txt ... numbers_8.txt (6 250 000 lines each).
    public static void Split(string sourcePath, string outputFolder)
    {
        var stopwatch = Stopwatch.StartNew();
        Directory.CreateDirectory(outputFolder);

        StreamWriter? writer = null;
        int part = 0;
        long lineNo = 0;

        foreach (var line in File.ReadLines(sourcePath))
        {
            if (lineNo % LinesPerPart == 0)
            {
                writer?.Dispose();
                part++;
                var path = Path.Combine(outputFolder, $"numbers_{part}.txt");
                writer = new StreamWriter(path, false, new UTF8Encoding(false), 1 << 20);
                writer.NewLine = "\n";
            }
            writer!.Write(line);
            writer.Write('\n');
            lineNo++;
        }
        writer?.Dispose();

        Console.WriteLine($"Split {lineNo:N0} lines into {part} files in '{outputFolder}' in {stopwatch.Elapsed.TotalSeconds:F1}s");
        if (lineNo != Count || part != Parts)
            Console.WriteLine("WARNING: expected 50 000 000 lines in 8 files.");
    }
}