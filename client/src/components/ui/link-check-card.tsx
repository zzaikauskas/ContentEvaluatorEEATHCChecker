import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { LinkStatus } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [expanded, setExpanded] = useState(false);

  // No links found
  if (totalLinks === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Link Analysis</CardTitle>
          <CardDescription>No links were found in the content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center text-center text-neutral-500 py-6">
            <p>No hyperlinks were detected in the content. Consider adding relevant links to improve the content's usefulness.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the percentage of working links
  const workingPercentage = totalLinks > 0 ? Math.round((workingLinks / totalLinks) * 100) : 0;

  // Determine the status color based on percentage of working links
  let statusColor = "bg-red-500";
  let statusText = "Poor";
  let statusIcon = <XCircle className="h-5 w-5 mr-1" />;

  if (workingPercentage >= 90) {
    statusColor = "bg-green-500";
    statusText = "Excellent";
    statusIcon = <CheckCircle className="h-5 w-5 mr-1" />;
  } else if (workingPercentage >= 75) {
    statusColor = "bg-yellow-500";
    statusText = "Good";
    statusIcon = <AlertTriangle className="h-5 w-5 mr-1" />;
  } else if (workingPercentage >= 50) {
    statusColor = "bg-orange-500";
    statusText = "Fair";
    statusIcon = <AlertTriangle className="h-5 w-5 mr-1" />;
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Link Analysis</CardTitle>
        <CardDescription>Assessment of hyperlinks in the content</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-neutral-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <span className="text-lg font-semibold mr-2">Link Health:</span>
              <div className="flex items-center">
                {statusIcon}
                <span className="font-semibold">{statusText}</span>
              </div>
            </div>
            <Badge variant="outline" className={cn("px-2 py-1", statusColor, "text-white")}>
              {workingPercentage}% Working
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-sm text-neutral-600">Total Links</p>
              <p className="text-2xl font-bold">{totalLinks}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-sm text-neutral-600">Working Links</p>
              <p className="text-2xl font-bold text-green-600">{workingLinks}</p>
            </div>
            <div className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-sm text-neutral-600">Broken Links</p>
              <p className="text-2xl font-bold text-red-600">{brokenLinks}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between"
          >
            <span>View {linkDetails.length} Links</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkDetails.map((link, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {link.ok ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          OK
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          Error
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <span className="truncate">{link.url}</span>
                        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell>
                      {link.status ? (
                        <Badge variant={link.ok ? "outline" : "destructive"}>
                          {link.status}
                        </Badge>
                      ) : (
                        <span className="text-sm text-neutral-600">
                          {link.error || "Connection failed"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LinkCheckCard;