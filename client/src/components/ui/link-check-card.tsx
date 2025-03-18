import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkStatus } from "@/lib/types";
import { AlertCircle, CheckCircle, ExternalLink, Link2 } from "lucide-react";

interface LinkCheckCardProps {
  totalLinks: number;
  brokenLinks: number;
  workingLinks: number;
  linkDetails: LinkStatus[];
}

const LinkCheckCard = ({
  totalLinks,
  brokenLinks,
  workingLinks,
  linkDetails
}: LinkCheckCardProps) => {
  if (!totalLinks || totalLinks === 0) {
    return null; // Don't show the card if there are no links
  }

  // Calculate percentage of working links
  const workingPercentage = totalLinks > 0 ? Math.round((workingLinks / totalLinks) * 100) : 0;

  // Determine status color based on the percentage of working links
  let statusColor = "bg-green-500";
  if (workingPercentage < 70) {
    statusColor = "bg-red-500";
  } else if (workingPercentage < 90) {
    statusColor = "bg-yellow-500";
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Link Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Link Health</span>
            <span className="text-sm font-medium">{workingPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className={`h-2.5 rounded-full ${statusColor}`}
              style={{ width: `${workingPercentage}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-neutral-700">{totalLinks}</p>
              <p className="text-xs text-neutral-600">Total Links</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-700">{workingLinks}</p>
              <p className="text-xs text-neutral-600">Working Links</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-lg font-bold text-red-700">{brokenLinks}</p>
              <p className="text-xs text-neutral-600">Broken Links</p>
            </div>
          </div>
        </div>

        {/* Link Details */}
        {linkDetails && linkDetails.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Link Details</h3>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">URL</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {linkDetails.map((link, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-neutral-700 truncate max-w-xs">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center hover:text-blue-600"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="h-3 w-3 ml-1 shrink-0" />
                        </a>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        {link.ok ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center justify-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {link.status === 403 || link.status === 405 ? "OK*" : (link.status || "OK")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center justify-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {link.status || "Error"}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Tip: Fix broken links to improve your content's trustworthiness and user experience.
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              <strong>Note:</strong> Links marked with "OK*" have 403 or 405 status codes but are likely working pages that restrict automated access.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkCheckCard;