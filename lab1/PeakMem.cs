using System.Diagnostics;
using System.Runtime.InteropServices;

public static class PeakMem
{
    [DllImport("libc", SetLastError = true)]
    private static extern int getrusage(int who, IntPtr usage);

    public static double Mb()
    {
        if (OperatingSystem.IsMacOS())
        {
            IntPtr buf = Marshal.AllocHGlobal(256);
            try
            {
                if (getrusage(0, buf) == 0)
                    return Marshal.ReadInt64(buf, 32) / (1024.0 * 1024.0);
            }
            finally { Marshal.FreeHGlobal(buf); }
        }
        return Process.GetCurrentProcess().PeakWorkingSet64 / (1024.0 * 1024.0);
    }
}
